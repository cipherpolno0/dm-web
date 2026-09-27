import { AuditAction, ResultNotificationStatus } from "@prisma/client";
import { Resend } from "resend";

import { writeAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/db/prisma";

const MAX_NOTIFICATION_ATTEMPTS = 5;

export function retryDelayMinutes(attemptCount: number) {
  return Math.min(24 * 60, 2 ** Math.max(0, attemptCount - 1) * 5);
}

function getEmailClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is required to deliver result notifications.");
  return new Resend(apiKey);
}

function getSender() {
  const sender = process.env.RESULT_NOTIFICATION_FROM;
  if (!sender)
    throw new Error("RESULT_NOTIFICATION_FROM is required to deliver result notifications.");
  return sender;
}

export async function processResultNotificationJob(jobId: string) {
  const prisma = getPrisma();
  const now = new Date();
  const claimed = await prisma.$transaction(async (transaction) => {
    const job = await transaction.resultNotificationJob.findFirst({
      where: {
        id: jobId,
        status: { in: [ResultNotificationStatus.PENDING, ResultNotificationStatus.FAILED] },
        nextAttemptAt: { lte: now },
        attemptCount: { lt: MAX_NOTIFICATION_ATTEMPTS },
        resultPublication: { isPublished: true, deletedAt: null },
      },
      include: {
        organization: { select: { nameTh: true } },
        resultPublication: { select: { id: true, publishedAt: true } },
      },
    });
    if (!job) return null;

    if (!job.recipientEmail) {
      await transaction.resultNotificationJob.update({
        where: { id: job.id },
        data: { status: ResultNotificationStatus.SKIPPED, lastError: "NO_NOTIFICATION_EMAIL" },
      });
      return null;
    }

    const lock = await transaction.resultNotificationJob.updateMany({
      where: {
        id: job.id,
        status: { in: [ResultNotificationStatus.PENDING, ResultNotificationStatus.FAILED] },
      },
      data: {
        status: ResultNotificationStatus.PROCESSING,
        attemptCount: { increment: 1 },
        lastError: null,
      },
    });
    if (lock.count !== 1) return null;

    return {
      id: job.id,
      recipientEmail: job.recipientEmail,
      organizationId: job.organizationId,
      organizationName: job.organization.nameTh,
      publicationId: job.resultPublication.id,
    };
  });
  if (!claimed) return { delivered: false, reason: "not-due-or-already-processed" as const };

  try {
    const passedCount = await prisma.resultPublicProjection.count({
      where: {
        resultPublicationId: claimed.publicationId,
        organizationId: claimed.organizationId,
        outcome: { contains: "ผ่าน" },
        isActive: true,
      },
    });
    await getEmailClient().emails.send({
      from: getSender(),
      to: [claimed.recipientEmail],
      subject: "ประกาศผลสอบธรรมศึกษา–นักธรรม",
      text: `สำนักเรียน${claimed.organizationName}\nผลสอบของผู้สมัครในสังกัดได้รับการประกาศแล้ว จำนวนผู้สอบผ่าน ${passedCount} รายการ\nกรุณาเข้าสู่ระบบเพื่อตรวจสอบและดาวน์โหลดรายงาน`,
    });
    await prisma.$transaction(async (transaction) => {
      await transaction.resultNotificationJob.update({
        where: { id: claimed.id },
        data: { status: ResultNotificationStatus.SENT, sentAt: new Date(), lastError: null },
      });
      await writeAuditLog(transaction, {
        actorId: null,
        action: AuditAction.UPDATE,
        entityType: "ResultNotificationJob",
        entityId: claimed.id,
        afterJson: { status: ResultNotificationStatus.SENT },
      });
    });
    return { delivered: true, reason: "sent" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_EMAIL_ERROR";
    const job = await prisma.resultNotificationJob.findUnique({
      where: { id: claimed.id },
      select: { attemptCount: true },
    });
    const attemptCount = job?.attemptCount ?? MAX_NOTIFICATION_ATTEMPTS;
    const nextAttemptAt = new Date(Date.now() + retryDelayMinutes(attemptCount) * 60_000);
    await prisma.$transaction(async (transaction) => {
      await transaction.resultNotificationJob.update({
        where: { id: claimed.id },
        data: {
          status: ResultNotificationStatus.FAILED,
          lastError: message,
          nextAttemptAt,
        },
      });
      await writeAuditLog(transaction, {
        actorId: null,
        action: AuditAction.UPDATE,
        entityType: "ResultNotificationJob",
        entityId: claimed.id,
        afterJson: {
          status: ResultNotificationStatus.FAILED,
          attemptCount,
          nextAttemptAt: nextAttemptAt.toISOString(),
        },
      });
    });
    throw error;
  }
}

export async function processDueResultNotificationJobs(limit = 50) {
  const jobs = await getPrisma().resultNotificationJob.findMany({
    where: {
      status: { in: [ResultNotificationStatus.PENDING, ResultNotificationStatus.FAILED] },
      nextAttemptAt: { lte: new Date() },
      attemptCount: { lt: MAX_NOTIFICATION_ATTEMPTS },
    },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
    select: { id: true },
  });
  const results = [];
  for (const job of jobs) {
    try {
      results.push(await processResultNotificationJob(job.id));
    } catch {
      results.push({ delivered: false, reason: "failed" as const });
    }
  }
  return results;
}
