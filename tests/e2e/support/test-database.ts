import { createHmac } from "node:crypto";

import { ApplicationStatus, ImportBatchStatus, PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

export const e2eUsers = {
  superAdmin: { username: "e2e-admin", password: "E2E-admin-2026" },
  fieldOfficer: { username: "e2e-officer", password: "E2E-officer-2026" },
  school: { username: "e2e-school", password: "E2E-school-2026" },
} as const;

export const e2eData = {
  organizationCode: "E2E-SCHOOL",
  examCenterCode: "E2E-CENTER",
  examProgramCode: "NDT-TRI-E2E",
  applicant: {
    nationalId: "1101700203450",
    firstName: "ทดสอบ",
    lastName: "อัตโนมัติ",
  },
} as const;

export function testDatabaseUrl() {
  const databaseUrl = process.env.E2E_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("E2E_DATABASE_URL is required. It must point to a dedicated test database.");
  }

  const databaseName = new URL(databaseUrl).pathname.toLowerCase();
  if (!databaseName.includes("test")) {
    throw new Error(
      "Refusing to run E2E setup: E2E_DATABASE_URL database name must include 'test'.",
    );
  }

  return databaseUrl;
}

export function testPrisma() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl() }) });
}

function nationalIdHash(value: string) {
  return createHmac("sha256", "e2e-test-only").update(value).digest("hex");
}

export async function resetAndSeedE2eDatabase() {
  const prisma = testPrisma();
  const passwordHash = await bcrypt.hash(e2eUsers.school.password, 12);
  const adminPasswordHash = await bcrypt.hash(e2eUsers.superAdmin.password, 12);
  const officerPasswordHash = await bcrypt.hash(e2eUsers.fieldOfficer.password, 12);

  try {
    await prisma.$transaction([
      prisma.resultNotificationJob.deleteMany(),
      prisma.resultPublicProjection.deleteMany(),
      prisma.resultPublication.deleteMany(),
      prisma.scoreRecord.deleteMany(),
      prisma.scoreRevision.deleteMany(),
      prisma.scoreImportRow.deleteMany(),
      prisma.scoreImportIssue.deleteMany(),
      prisma.scoreImportBatch.deleteMany(),
      prisma.seatAssignment.deleteMany(),
      prisma.seatSequence.deleteMany(),
      prisma.examApplication.deleteMany(),
      prisma.applicationImportBatch.deleteMany(),
      prisma.applicant.deleteMany(),
      prisma.calendarEvent.deleteMany(),
      prisma.mediaFile.deleteMany(),
      prisma.authAuditLog.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.user.deleteMany(),
      prisma.examProgram.deleteMany(),
      prisma.examCenter.deleteMany(),
      prisma.organization.deleteMany(),
      prisma.examLevel.deleteMany(),
      prisma.examType.deleteMany(),
      prisma.academicYear.deleteMany(),
    ]);

    const organization = await prisma.organization.create({
      data: { code: e2eData.organizationCode, nameTh: "สำนักเรียนทดสอบอัตโนมัติ" },
    });
    const examCenter = await prisma.examCenter.create({
      data: { code: e2eData.examCenterCode, nameTh: "สนามสอบทดสอบอัตโนมัติ" },
    });
    const academicYear = await prisma.academicYear.create({
      data: { yearBe: 2569, label: "ปีการศึกษา 2569" },
    });
    const examType = await prisma.examType.create({ data: { code: "NAKDAM", nameTh: "นักธรรม" } });
    const examLevel = await prisma.examLevel.create({
      data: { code: "TRI", nameTh: "นักธรรมตรี" },
    });
    const examProgram = await prisma.examProgram.create({
      data: {
        academicYearId: academicYear.id,
        examTypeId: examType.id,
        examLevelId: examLevel.id,
        code: e2eData.examProgramCode,
      },
    });
    const [superAdmin, fieldOfficer, school] = await Promise.all([
      prisma.user.create({
        data: {
          username: e2eUsers.superAdmin.username,
          passwordHash: adminPasswordHash,
          role: UserRole.super_admin,
        },
      }),
      prisma.user.create({
        data: {
          username: e2eUsers.fieldOfficer.username,
          passwordHash: officerPasswordHash,
          role: UserRole.field_officer,
          examCenterId: examCenter.id,
        },
      }),
      prisma.user.create({
        data: {
          username: e2eUsers.school.username,
          passwordHash,
          role: UserRole.school,
          organizationId: organization.id,
        },
      }),
    ]);

    return {
      organization,
      examCenter,
      academicYear,
      examType,
      examLevel,
      examProgram,
      superAdmin,
      fieldOfficer,
      school,
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function prepareApprovedScoreForE2e() {
  const prisma = testPrisma();
  try {
    const application = await prisma.examApplication.findFirstOrThrow({
      where: {
        status: ApplicationStatus.CENTER_APPROVED,
        applicant: {
          firstName: e2eData.applicant.firstName,
          lastName: e2eData.applicant.lastName,
          nationalIdHash: nationalIdHash(e2eData.applicant.nationalId),
        },
      },
      include: { examProgram: true },
    });
    const superAdmin = await prisma.user.findFirstOrThrow({
      where: { username: e2eUsers.superAdmin.username },
    });
    const batch = await prisma.scoreImportBatch.create({
      data: {
        examProgramId: application.examProgramId,
        sourceFileName: "e2e-scores.xlsx",
        sourceSha256: "a".repeat(64),
        bucket: "e2e-test-private-media",
        objectKey: `e2e/${application.id}/scores.xlsx`,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        sizeBytes: 1,
        status: ImportBatchStatus.COMMITTED,
        totalRows: 1,
        validRows: 1,
        committedAt: new Date(),
        createdById: superAdmin.id,
        rows: {
          create: {
            rowNumber: 2,
            seatNo: (
              await prisma.seatAssignment.findUniqueOrThrow({
                where: { applicationId: application.id },
              })
            ).seatNo,
            applicationId: application.id,
            score: 82,
            outcome: "ผ่าน",
          },
        },
      },
    });
    const revision = await prisma.scoreRevision.create({
      data: {
        applicationId: application.id,
        scoreImportBatchId: batch.id,
        score: 82,
        outcome: "ผ่าน",
        importedById: superAdmin.id,
      },
    });
    await prisma.scoreRecord.create({
      data: {
        applicationId: application.id,
        currentRevisionId: revision.id,
        score: 82,
        outcome: "ผ่าน",
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
