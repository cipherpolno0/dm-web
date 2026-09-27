import {
  ApplicationSource,
  ApplicationStatus,
  AuditAction,
  ImportBatchStatus,
  Prisma,
  ResultPublicationStatus,
} from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import { assertRole, type AuthPrincipal } from "@/lib/authorization/require-role";
import { getPrisma } from "@/lib/db/prisma";
import { parseWorkbookRows, type PreparedExcelFile } from "@/lib/exam/excel";
import { validateScoreRows } from "@/lib/exam/score-validation";
import {
  removeStoredImportSource,
  storeImportSource,
  type StoredImportFile,
} from "@/lib/exam/storage";
import {
  hashNationalId,
  isValidThaiNationalId,
  normalizeCode,
  normalizeNationalId,
  normalizeText,
} from "@/lib/exam/validation";

const applicationColumns = {
  nationalId: ["nationalId", "เลขบัตรประชาชน"],
  firstName: ["firstName", "ชื่อ"],
  lastName: ["lastName", "นามสกุล"],
  schoolCode: ["schoolCode", "รหัสสำนักเรียน"],
  examCenterCode: ["examCenterCode", "รหัสสนามสอบ"],
  examProgramCode: ["examProgramCode", "รหัสหลักสูตร"],
} as const;

const scoreColumns = {
  seatNo: ["seatNo", "เลขที่นั่งสอบ"],
  score: ["score", "คะแนน"],
  outcome: ["outcome", "ผลการสอบ"],
} as const;

type ApplicationInput = Readonly<{
  nationalId: string;
  firstName: string;
  lastName: string;
  schoolCode: string;
  examCenterCode: string;
  examProgramCode: string;
}>;

export type ImportRowIssue = Readonly<{
  rowNumber: number;
  message: string;
}>;

function inputFromRow(values: Record<string, string>): ApplicationInput {
  return {
    nationalId: normalizeNationalId(values.nationalId),
    firstName: normalizeText(values.firstName),
    lastName: normalizeText(values.lastName),
    schoolCode: normalizeCode(values.schoolCode),
    examCenterCode: normalizeCode(values.examCenterCode),
    examProgramCode: normalizeCode(values.examProgramCode),
  };
}

async function getSchoolOrganization(actor: AuthPrincipal) {
  assertRole(actor, ["school"]);
  if (!actor.organizationId) throw new Error("บัญชีสำนักเรียนยังไม่ได้ผูกกับสำนักเรียน");

  const organization = await getPrisma().organization.findFirst({
    where: { id: actor.organizationId, deletedAt: null },
    select: { id: true, code: true },
  });
  if (!organization) throw new Error("ไม่พบสำนักเรียนที่ผูกกับบัญชีผู้ใช้");
  return organization;
}

async function resolveApplicationReferences(rows: readonly ApplicationInput[]) {
  const prisma = getPrisma();
  const [examCenters, examPrograms] = await Promise.all([
    prisma.examCenter.findMany({
      where: { deletedAt: null, code: { in: [...new Set(rows.map((row) => row.examCenterCode))] } },
      select: { id: true, code: true },
    }),
    prisma.examProgram.findMany({
      where: { code: { in: [...new Set(rows.map((row) => row.examProgramCode))] } },
      select: { id: true, code: true },
    }),
  ]);

  return {
    centersByCode: new Map(examCenters.map((item) => [normalizeCode(item.code), item])),
    programsByCode: new Map(examPrograms.map((item) => [normalizeCode(item.code), item])),
  };
}

async function validateApplicationRows(
  rows: readonly Readonly<{ rowNumber: number; input: ApplicationInput }>[],
  organizationCode: string,
) {
  const issues: ImportRowIssue[] = [];
  const seenApplicantProgram = new Set<string>();
  const normalizedRows = rows.map((row) => ({
    ...row,
    nationalIdHash: hashNationalId(row.input.nationalId),
  }));
  const { centersByCode, programsByCode } = await resolveApplicationReferences(
    normalizedRows.map((row) => row.input),
  );

  for (const row of normalizedRows) {
    const { input } = row;
    if (!isValidThaiNationalId(input.nationalId)) {
      issues.push({ rowNumber: row.rowNumber, message: "เลขบัตรประชาชน 13 หลักไม่ถูกต้อง" });
    }
    if (!input.firstName || !input.lastName) {
      issues.push({ rowNumber: row.rowNumber, message: "ต้องระบุชื่อและนามสกุล" });
    }
    if (input.schoolCode !== normalizeCode(organizationCode)) {
      issues.push({ rowNumber: row.rowNumber, message: "รหัสสำนักเรียนไม่ตรงกับบัญชีผู้ยื่น" });
    }
    if (!centersByCode.has(input.examCenterCode)) {
      issues.push({ rowNumber: row.rowNumber, message: "ไม่พบรหัสสนามสอบ" });
    }
    if (!programsByCode.has(input.examProgramCode)) {
      issues.push({ rowNumber: row.rowNumber, message: "ไม่พบรหัสหลักสูตรสอบ" });
    }
    const duplicateKey = `${row.nationalIdHash}:${input.examProgramCode}`;
    if (seenApplicantProgram.has(duplicateKey)) {
      issues.push({ rowNumber: row.rowNumber, message: "ผู้สมัครซ้ำในหลักสูตรเดียวกันภายในไฟล์" });
    }
    seenApplicantProgram.add(duplicateKey);
  }

  const hashes = [...new Set(normalizedRows.map((row) => row.nationalIdHash))];
  const applicantRecords = await getPrisma().applicant.findMany({
    where: { nationalIdHash: { in: hashes } },
    select: { id: true, nationalIdHash: true, deletedAt: true },
  });
  const applicantByHash = new Map(applicantRecords.map((item) => [item.nationalIdHash, item]));
  const applications = await getPrisma().examApplication.findMany({
    where: {
      applicantId: { in: applicantRecords.map((item) => item.id) },
      deletedAt: null,
    },
    select: { applicantId: true, examProgramId: true },
  });
  const applicationKeys = new Set(
    applications.map((item) => `${item.applicantId}:${item.examProgramId}`),
  );

  for (const row of normalizedRows) {
    const applicant = applicantByHash.get(row.nationalIdHash);
    const program = programsByCode.get(row.input.examProgramCode);
    if (applicant?.deletedAt) {
      issues.push({
        rowNumber: row.rowNumber,
        message: "ผู้สมัครรายนี้ถูกปิดใช้งาน โปรดติดต่อผู้ดูแล",
      });
    }
    if (applicant && program && applicationKeys.has(`${applicant.id}:${program.id}`)) {
      issues.push({ rowNumber: row.rowNumber, message: "ผู้สมัครมีใบสมัครในหลักสูตรนี้แล้ว" });
    }
  }

  return { issues, rows: normalizedRows, centersByCode, programsByCode };
}

export async function submitManualApplication(actor: AuthPrincipal, input: ApplicationInput) {
  const organization = await getSchoolOrganization(actor);
  const validation = await validateApplicationRows([{ rowNumber: 1, input }], organization.code);
  if (validation.issues.length > 0)
    throw new Error(validation.issues.map((item) => item.message).join("; "));

  const row = validation.rows[0];
  const examCenter = validation.centersByCode.get(row.input.examCenterCode)!;
  const examProgram = validation.programsByCode.get(row.input.examProgramCode)!;
  const prisma = getPrisma();

  return prisma.$transaction(async (transaction) => {
    const applicant = await transaction.applicant.upsert({
      where: { nationalIdHash: row.nationalIdHash },
      create: {
        nationalIdHash: row.nationalIdHash,
        nationalIdLast4: row.input.nationalId.slice(-4),
        firstName: row.input.firstName,
        lastName: row.input.lastName,
      },
      update: {},
    });
    const application = await transaction.examApplication.create({
      data: {
        applicantId: applicant.id,
        organizationId: organization.id,
        examCenterId: examCenter.id,
        examProgramId: examProgram.id,
        status: ApplicationStatus.SUBMITTED_TO_CENTER,
        source: ApplicationSource.MANUAL,
        submittedAt: new Date(),
        createdById: actor.id,
      },
    });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: AuditAction.CREATE,
      entityType: "ExamApplication",
      entityId: application.id,
      afterJson: {
        source: ApplicationSource.MANUAL,
        examProgramId: examProgram.id,
        examCenterId: examCenter.id,
      },
    });
    return application;
  });
}

export async function importApplicationsFromExcel(
  actor: AuthPrincipal,
  prepared: PreparedExcelFile,
) {
  const organization = await getSchoolOrganization(actor);
  const spreadsheetRows = await parseWorkbookRows(prepared.bytes, applicationColumns);
  const validation = await validateApplicationRows(
    spreadsheetRows.map((row) => ({ rowNumber: row.rowNumber, input: inputFromRow(row.values) })),
    organization.code,
  );
  if (validation.issues.length > 0) return { imported: 0, issues: validation.issues };

  let stored: StoredImportFile | null = null;
  try {
    stored = await storeImportSource("applications", prepared);
    if (!stored) throw new Error("ไม่สามารถเก็บไฟล์ต้นฉบับได้");
    const storedFile = stored;
    const result = await getPrisma().$transaction(async (transaction) => {
      const batch = await transaction.applicationImportBatch.create({
        data: {
          organizationId: organization.id,
          createdById: actor.id,
          sourceFileName: prepared.originalName,
          sourceSha256: prepared.sha256,
          bucket: storedFile.bucket,
          objectKey: storedFile.objectKey,
          mimeType: prepared.mimeType,
          sizeBytes: prepared.sizeBytes,
          status: ImportBatchStatus.COMMITTED,
          totalRows: validation.rows.length,
          acceptedRows: validation.rows.length,
        },
      });

      for (const row of validation.rows) {
        const applicant = await transaction.applicant.upsert({
          where: { nationalIdHash: row.nationalIdHash },
          create: {
            nationalIdHash: row.nationalIdHash,
            nationalIdLast4: row.input.nationalId.slice(-4),
            firstName: row.input.firstName,
            lastName: row.input.lastName,
          },
          update: {},
        });
        await transaction.examApplication.create({
          data: {
            applicantId: applicant.id,
            organizationId: organization.id,
            examCenterId: validation.centersByCode.get(row.input.examCenterCode)!.id,
            examProgramId: validation.programsByCode.get(row.input.examProgramCode)!.id,
            applicationImportBatchId: batch.id,
            status: ApplicationStatus.SUBMITTED_TO_CENTER,
            source: ApplicationSource.EXCEL_IMPORT,
            submittedAt: new Date(),
            createdById: actor.id,
          },
        });
      }
      await writeAuditLog(transaction, {
        actorId: actor.id,
        action: AuditAction.IMPORT,
        entityType: "ApplicationImportBatch",
        entityId: batch.id,
        afterJson: { totalRows: validation.rows.length, sourceSha256: prepared.sha256 },
      });
      return batch;
    });
    return { imported: validation.rows.length, issues: [] as ImportRowIssue[], batchId: result.id };
  } catch (error) {
    if (stored) await removeStoredImportSource(stored);
    throw error;
  }
}

export async function approveApplicationAndAssignSeat(actor: AuthPrincipal, applicationId: string) {
  const prisma = getPrisma();
  const current = await prisma.examApplication.findFirst({
    where: { id: applicationId, deletedAt: null },
    select: { examCenterId: true },
  });
  if (!current) throw new Error("ไม่พบใบสมัครที่ต้องการอนุมัติ");
  assertRole(actor, ["super_admin", "field_officer"], { examCenterId: current.examCenterId });

  return prisma.$transaction(
    async (transaction) => {
      const application = await transaction.examApplication.findFirst({
        where: { id: applicationId, deletedAt: null },
        include: {
          seatAssignment: true,
          examCenter: { select: { code: true } },
          examProgram: { select: { code: true, academicYear: { select: { yearBe: true } } } },
        },
      });
      if (!application) throw new Error("ไม่พบใบสมัครที่ต้องการอนุมัติ");
      if (application.seatAssignment) return application.seatAssignment;
      if (application.status !== ApplicationStatus.SUBMITTED_TO_CENTER) {
        throw new Error("ใบสมัครไม่ได้อยู่ในสถานะรออนุมัติ");
      }

      const sequence = await transaction.seatSequence.upsert({
        where: {
          examCenterId_examProgramId: {
            examCenterId: application.examCenterId,
            examProgramId: application.examProgramId,
          },
        },
        create: {
          examCenterId: application.examCenterId,
          examProgramId: application.examProgramId,
          nextSequence: 2,
        },
        update: { nextSequence: { increment: 1 } },
      });
      const sequenceNo = sequence.nextSequence - 1;
      const seatNo = `${application.examCenter.code}-${application.examProgram.academicYear.yearBe}-${application.examProgram.code}-${String(sequenceNo).padStart(5, "0")}`;
      const seatAssignment = await transaction.seatAssignment.create({
        data: {
          applicationId: application.id,
          examCenterId: application.examCenterId,
          examProgramId: application.examProgramId,
          sequenceNo,
          seatNo,
          issuedById: actor.id,
        },
      });
      await transaction.examApplication.update({
        where: { id: application.id },
        data: {
          status: ApplicationStatus.CENTER_APPROVED,
          approvedAt: new Date(),
          approvedById: actor.id,
        },
      });
      await writeAuditLog(transaction, {
        actorId: actor.id,
        action: AuditAction.APPROVE,
        entityType: "ExamApplication",
        entityId: application.id,
        beforeJson: { status: application.status },
        afterJson: { status: ApplicationStatus.CENTER_APPROVED, seatNo },
      });
      return seatAssignment;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function previewScoreImport(
  actor: AuthPrincipal,
  examProgramId: string,
  prepared: PreparedExcelFile,
) {
  assertRole(actor, ["super_admin"]);
  const prisma = getPrisma();
  const program = await prisma.examProgram.findUnique({
    where: { id: examProgramId },
    select: { id: true },
  });
  if (!program) throw new Error("ไม่พบหลักสูตรสอบที่เลือก");

  const stored = await storeImportSource("scores", prepared);
  try {
    let spreadsheetRows;
    try {
      spreadsheetRows = await parseWorkbookRows(prepared.bytes, scoreColumns);
    } catch (error) {
      const message = error instanceof Error ? error.message : "รูปแบบไฟล์ไม่ถูกต้อง";
      const batch = await prisma.$transaction(async (transaction) => {
        const created = await transaction.scoreImportBatch.create({
          data: {
            examProgramId,
            sourceFileName: prepared.originalName,
            sourceSha256: prepared.sha256,
            bucket: stored.bucket,
            objectKey: stored.objectKey,
            mimeType: prepared.mimeType,
            sizeBytes: prepared.sizeBytes,
            status: ImportBatchStatus.REJECTED,
            createdById: actor.id,
            issues: { create: { rowNumber: 1, code: "INVALID_WORKBOOK", message } },
          },
        });
        await writeAuditLog(transaction, {
          actorId: actor.id,
          action: AuditAction.IMPORT,
          entityType: "ScoreImportBatch",
          entityId: created.id,
          afterJson: { totalRows: 0, validRows: 0, issueCount: 1, rejected: true },
        });
        return created;
      });
      return { batchId: batch.id, totalRows: 0, validRows: 0, issues: [{ rowNumber: 1, message }] };
    }

    const seatNumbers = spreadsheetRows.map((row) =>
      normalizeText(row.values.seatNo).toUpperCase().replace(/\s+/g, ""),
    );
    const seats = await prisma.seatAssignment.findMany({
      where: { seatNo: { in: seatNumbers } },
      select: { seatNo: true, applicationId: true, examProgramId: true },
    });
    const validation = validateScoreRows(
      spreadsheetRows,
      examProgramId,
      new Map(
        seats.map((seat) => [
          seat.seatNo,
          { applicationId: seat.applicationId, examProgramId: seat.examProgramId },
        ]),
      ),
    );
    const batch = await prisma.$transaction(async (transaction) => {
      const created = await transaction.scoreImportBatch.create({
        data: {
          examProgramId,
          sourceFileName: prepared.originalName,
          sourceSha256: prepared.sha256,
          bucket: stored.bucket,
          objectKey: stored.objectKey,
          mimeType: prepared.mimeType,
          sizeBytes: prepared.sizeBytes,
          status:
            validation.issues.length === 0 ? ImportBatchStatus.READY : ImportBatchStatus.REJECTED,
          totalRows: spreadsheetRows.length,
          validRows: validation.validRows.length,
          createdById: actor.id,
          issues: { create: validation.issues },
          rows: { create: validation.validRows },
        },
      });
      await writeAuditLog(transaction, {
        actorId: actor.id,
        action: AuditAction.IMPORT,
        entityType: "ScoreImportBatch",
        entityId: created.id,
        afterJson: {
          totalRows: spreadsheetRows.length,
          validRows: validation.validRows.length,
          issueCount: validation.issues.length,
        },
      });
      return created;
    });
    return {
      batchId: batch.id,
      totalRows: spreadsheetRows.length,
      validRows: validation.validRows.length,
      issues: validation.issues.map(({ rowNumber, message }) => ({ rowNumber, message })),
    };
  } catch (error) {
    await removeStoredImportSource(stored);
    throw error;
  }
}

export async function commitScoreImport(actor: AuthPrincipal, scoreImportBatchId: string) {
  assertRole(actor, ["super_admin"]);
  const prisma = getPrisma();

  return prisma.$transaction(
    async (transaction) => {
      const locked = await transaction.scoreImportBatch.updateMany({
        where: { id: scoreImportBatchId, status: ImportBatchStatus.READY, deletedAt: null },
        data: { status: ImportBatchStatus.VALIDATING },
      });
      if (locked.count !== 1) throw new Error("ชุดนำเข้ายังไม่พร้อมบันทึก หรือถูกบันทึกไปแล้ว");

      const batch = await transaction.scoreImportBatch.findUnique({
        where: { id: scoreImportBatchId },
        include: { issues: true, rows: { orderBy: { rowNumber: "asc" } } },
      });
      if (!batch || batch.issues.length > 0 || batch.rows.length !== batch.totalRows) {
        throw new Error("พบข้อผิดพลาดในชุดนำเข้า จึงไม่บันทึกคะแนนใด ๆ");
      }

      for (const row of batch.rows) {
        const revision = await transaction.scoreRevision.create({
          data: {
            applicationId: row.applicationId,
            scoreImportBatchId: batch.id,
            score: row.score,
            outcome: row.outcome,
            importedById: actor.id,
          },
        });
        await transaction.scoreRecord.upsert({
          where: { applicationId: row.applicationId },
          create: {
            applicationId: row.applicationId,
            currentRevisionId: revision.id,
            score: row.score,
            outcome: row.outcome,
          },
          update: {
            currentRevisionId: revision.id,
            score: row.score,
            outcome: row.outcome,
          },
        });
      }
      const committedAt = new Date();
      await transaction.scoreImportBatch.update({
        where: { id: batch.id },
        data: { status: ImportBatchStatus.COMMITTED, committedAt },
      });
      await writeAuditLog(transaction, {
        actorId: actor.id,
        action: AuditAction.IMPORT,
        entityType: "ScoreImportBatch",
        entityId: batch.id,
        afterJson: { committedAt: committedAt.toISOString(), validRows: batch.rows.length },
      });
      return { imported: batch.rows.length, committedAt };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function publishResults(actor: AuthPrincipal, examProgramId: string) {
  assertRole(actor, ["super_admin"]);
  const prisma = getPrisma();

  return prisma.$transaction(
    async (transaction) => {
      const program = await transaction.examProgram.findUnique({
        where: { id: examProgramId },
        select: {
          id: true,
          academicYearId: true,
          academicYear: { select: { yearBe: true } },
          examType: { select: { code: true } },
          examLevel: { select: { code: true } },
        },
      });
      if (!program) throw new Error("ไม่พบหลักสูตรสอบที่เลือก");

      const records = await transaction.scoreRecord.findMany({
        where: {
          application: {
            examProgramId,
            status: ApplicationStatus.CENTER_APPROVED,
            deletedAt: null,
          },
        },
        select: {
          outcome: true,
          application: {
            select: {
              applicant: { select: { firstName: true, lastName: true } },
              organization: { select: { nameTh: true } },
              seatAssignment: { select: { seatNo: true } },
            },
          },
        },
      });
      if (records.length === 0) throw new Error("ยังไม่มีคะแนนที่อนุมัติให้ประกาศผล");

      await transaction.resultPublicProjection.updateMany({
        where: { publication: { examProgramId, isPublished: true } },
        data: { isActive: false },
      });
      await transaction.resultPublication.updateMany({
        where: { examProgramId, isPublished: true },
        data: { status: ResultPublicationStatus.UNPUBLISHED, isPublished: false },
      });
      const previous = await transaction.resultPublication.aggregate({
        where: { examProgramId },
        _max: { publicationNo: true },
      });
      const publication = await transaction.resultPublication.create({
        data: {
          examProgramId,
          publicationNo: (previous._max.publicationNo ?? 0) + 1,
          status: ResultPublicationStatus.PREPARING,
          isPublished: false,
        },
      });
      await transaction.resultPublicProjection.createMany({
        data: records.map((record) => ({
          resultPublicationId: publication.id,
          academicYearId: program.academicYearId,
          displayName: `${record.application.applicant.firstName} ${record.application.applicant.lastName}`,
          seatNo: record.application.seatAssignment?.seatNo ?? null,
          examTypeCode: program.examType.code,
          examLevelCode: program.examLevel.code,
          outcome: record.outcome,
          publicOrganizationName: record.application.organization.nameTh,
          isActive: true,
        })),
      });
      const publishedAt = new Date();
      await transaction.resultPublication.update({
        where: { id: publication.id },
        data: { status: ResultPublicationStatus.PUBLISHED, isPublished: true, publishedAt },
      });
      await writeAuditLog(transaction, {
        actorId: actor.id,
        action: AuditAction.PUBLISH,
        entityType: "ResultPublication",
        entityId: publication.id,
        afterJson: {
          examProgramId,
          publishedAt: publishedAt.toISOString(),
          rowCount: records.length,
        },
      });
      return { publicationId: publication.id, publishedAt, rowCount: records.length };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
