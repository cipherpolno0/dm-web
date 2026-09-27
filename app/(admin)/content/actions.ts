"use server";

import { AuditAction, AnnouncementStatus } from "@prisma/client";
import sanitizeHtml from "sanitize-html";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";
import { announcementInputSchema } from "@/lib/validation/cms";

const cmsRoles = ["super_admin", "field_officer"] as const;

function slugify(value: string) {
  const slug = value
    .trim()
    .toLocaleLowerCase("th-TH")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "announcement";
}

function sanitizeAnnouncementHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "blockquote",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  }).trim();
}

function inputFromFormData(formData: FormData) {
  const parsed = announcementInputSchema.parse({
    title: formData.get("title"),
    category: formData.get("category"),
    bodyHtml: formData.get("bodyHtml"),
    status: formData.get("status"),
    publishedAt: formData.get("publishedAt") || undefined,
  });
  const bodyHtml = sanitizeAnnouncementHtml(parsed.bodyHtml);

  if (!bodyHtml) {
    throw new Error("เนื้อหาประกาศไม่ถูกต้อง");
  }

  const publishedAt =
    parsed.status === "PUBLISHED"
      ? parsed.publishedAt
        ? new Date(parsed.publishedAt)
        : new Date()
      : null;

  if (publishedAt && Number.isNaN(publishedAt.getTime())) {
    throw new Error("กำหนดเวลาเผยแพร่ไม่ถูกต้อง");
  }

  return { ...parsed, bodyHtml, publishedAt };
}

async function uniqueSlug(title: string, id?: string) {
  const prisma = getPrisma();
  const base = slugify(title);

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const slug = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const existing = await prisma.announcement.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === id) {
      return slug;
    }
  }

  throw new Error("ไม่สามารถสร้าง URL ของประกาศที่ไม่ซ้ำได้");
}

export async function createAnnouncementAction(formData: FormData) {
  const actor = await requireRole(cmsRoles);
  const input = inputFromFormData(formData);
  const slug = await uniqueSlug(input.title);
  const prisma = getPrisma();

  await prisma.$transaction(async (transaction) => {
    const announcement = await transaction.announcement.create({
      data: {
        title: input.title,
        slug,
        summary: null,
        bodyMarkdown: input.bodyHtml,
        bodyHtml: input.bodyHtml,
        category: input.category,
        status: input.status as AnnouncementStatus,
        publishedAt: input.publishedAt,
      },
    });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: AuditAction.CREATE,
      entityType: "Announcement",
      entityId: announcement.id,
      afterJson: {
        title: announcement.title,
        slug: announcement.slug,
        status: announcement.status,
        publishedAt: announcement.publishedAt?.toISOString() ?? null,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/content");
  redirect("/content");
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
  const actor = await requireRole(cmsRoles);
  const input = inputFromFormData(formData);
  const prisma = getPrisma();
  const current = await prisma.announcement.findFirst({ where: { id, deletedAt: null } });

  if (!current) {
    throw new Error("ไม่พบประกาศที่ต้องการแก้ไข");
  }

  const slug = await uniqueSlug(input.title, id);
  await prisma.$transaction(async (transaction) => {
    const announcement = await transaction.announcement.update({
      where: { id },
      data: {
        title: input.title,
        slug,
        bodyMarkdown: input.bodyHtml,
        bodyHtml: input.bodyHtml,
        category: input.category,
        status: input.status as AnnouncementStatus,
        publishedAt: input.publishedAt,
      },
    });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: AuditAction.UPDATE,
      entityType: "Announcement",
      entityId: id,
      beforeJson: {
        title: current.title,
        slug: current.slug,
        status: current.status,
        publishedAt: current.publishedAt?.toISOString() ?? null,
      },
      afterJson: {
        title: announcement.title,
        slug: announcement.slug,
        status: announcement.status,
        publishedAt: announcement.publishedAt?.toISOString() ?? null,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/content");
  redirect("/content");
}

export async function deleteAnnouncementAction(id: string) {
  const actor = await requireRole(cmsRoles);
  const prisma = getPrisma();
  const current = await prisma.announcement.findFirst({ where: { id, deletedAt: null } });

  if (!current) {
    throw new Error("ไม่พบประกาศที่ต้องการลบ");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.announcement.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: AuditAction.SOFT_DELETE,
      entityType: "Announcement",
      entityId: id,
      beforeJson: { title: current.title, slug: current.slug },
    });
  });

  revalidatePath("/");
  revalidatePath("/content");
}
