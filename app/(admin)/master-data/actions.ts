"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";
import {
  academicYearInputSchema,
  examCenterInputSchema,
  examLevelInputSchema,
  optionalId,
  organizationInputSchema,
} from "@/lib/validation/cms";

function revalidateMasterData() {
  revalidatePath("/master-data");
}

export async function saveOrganizationAction(formData: FormData) {
  const actor = await requireRole(["super_admin"]);
  const input = organizationInputSchema.parse({
    id: optionalId(formData),
    code: formData.get("code"),
    nameTh: formData.get("nameTh"),
    notificationEmail: formData.get("notificationEmail"),
  });
  const prisma = getPrisma();
  const current = input.id
    ? await prisma.organization.findFirst({ where: { id: input.id, deletedAt: null } })
    : null;
  if (input.id && !current) throw new Error("ไม่พบสำนักเรียนที่ต้องการแก้ไข");
  await prisma.$transaction(async (transaction) => {
    const record = current
      ? await transaction.organization.update({
          where: { id: current.id },
          data: {
            code: input.code,
            nameTh: input.nameTh,
            notificationEmail: input.notificationEmail || null,
          },
        })
      : await transaction.organization.create({
          data: {
            code: input.code,
            nameTh: input.nameTh,
            notificationEmail: input.notificationEmail || null,
          },
        });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: current ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: "Organization",
      entityId: record.id,
      beforeJson: current
        ? {
            code: current.code,
            nameTh: current.nameTh,
            notificationEmail: current.notificationEmail,
          }
        : undefined,
      afterJson: {
        code: record.code,
        nameTh: record.nameTh,
        notificationEmail: record.notificationEmail,
      },
    });
  });
  revalidateMasterData();
}

export async function saveExamCenterAction(formData: FormData) {
  const input = examCenterInputSchema.parse({
    id: optionalId(formData),
    code: formData.get("code"),
    nameTh: formData.get("nameTh"),
  });
  if (!input.id) {
    await requireRole(["super_admin"]);
  }
  const actor = await requireRole(
    ["super_admin", "field_officer"],
    input.id ? { examCenterId: input.id } : {},
  );
  const prisma = getPrisma();
  const current = input.id
    ? await prisma.examCenter.findFirst({ where: { id: input.id, deletedAt: null } })
    : null;
  if (input.id && !current) throw new Error("ไม่พบสนามสอบที่ต้องการแก้ไข");
  await prisma.$transaction(async (transaction) => {
    const record = current
      ? await transaction.examCenter.update({
          where: { id: current.id },
          data: { code: input.code, nameTh: input.nameTh },
        })
      : await transaction.examCenter.create({ data: { code: input.code, nameTh: input.nameTh } });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: current ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: "ExamCenter",
      entityId: record.id,
      beforeJson: current ? { code: current.code, nameTh: current.nameTh } : undefined,
      afterJson: { code: record.code, nameTh: record.nameTh },
    });
  });
  revalidateMasterData();
}

export async function saveExamLevelAction(formData: FormData) {
  const actor = await requireRole(["super_admin"]);
  const input = examLevelInputSchema.parse({
    id: optionalId(formData),
    code: formData.get("code"),
    nameTh: formData.get("nameTh"),
  });
  const prisma = getPrisma();
  const current = input.id
    ? await prisma.examLevel.findFirst({ where: { id: input.id, deletedAt: null } })
    : null;
  if (input.id && !current) throw new Error("ไม่พบระดับชั้นที่ต้องการแก้ไข");
  await prisma.$transaction(async (transaction) => {
    const record = current
      ? await transaction.examLevel.update({
          where: { id: current.id },
          data: { code: input.code, nameTh: input.nameTh },
        })
      : await transaction.examLevel.create({ data: { code: input.code, nameTh: input.nameTh } });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: current ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: "ExamLevel",
      entityId: record.id,
      beforeJson: current ? { code: current.code, nameTh: current.nameTh } : undefined,
      afterJson: { code: record.code, nameTh: record.nameTh },
    });
  });
  revalidateMasterData();
}

export async function saveAcademicYearAction(formData: FormData) {
  const actor = await requireRole(["super_admin"]);
  const input = academicYearInputSchema.parse({
    id: optionalId(formData),
    yearBe: formData.get("yearBe"),
    label: formData.get("label"),
  });
  const prisma = getPrisma();
  const current = input.id
    ? await prisma.academicYear.findFirst({ where: { id: input.id, deletedAt: null } })
    : null;
  if (input.id && !current) throw new Error("ไม่พบปีการศึกษาที่ต้องการแก้ไข");
  await prisma.$transaction(async (transaction) => {
    const record = current
      ? await transaction.academicYear.update({
          where: { id: current.id },
          data: { yearBe: input.yearBe, label: input.label },
        })
      : await transaction.academicYear.create({
          data: { yearBe: input.yearBe, label: input.label },
        });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: current ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: "AcademicYear",
      entityId: record.id,
      beforeJson: current ? { yearBe: current.yearBe, label: current.label } : undefined,
      afterJson: { yearBe: record.yearBe, label: record.label },
    });
  });
  revalidateMasterData();
}

async function softDelete(
  entity: "Organization" | "ExamCenter" | "ExamLevel" | "AcademicYear",
  id: string,
) {
  const actor =
    entity === "ExamCenter"
      ? await requireRole(["super_admin", "field_officer"], { examCenterId: id })
      : await requireRole(["super_admin"]);
  const prisma = getPrisma();
  const current =
    entity === "Organization"
      ? await prisma.organization.findFirst({ where: { id, deletedAt: null } })
      : entity === "ExamCenter"
        ? await prisma.examCenter.findFirst({ where: { id, deletedAt: null } })
        : entity === "ExamLevel"
          ? await prisma.examLevel.findFirst({ where: { id, deletedAt: null } })
          : await prisma.academicYear.findFirst({ where: { id, deletedAt: null } });
  if (!current) throw new Error("ไม่พบข้อมูลที่ต้องการลบ");
  await prisma.$transaction(async (transaction) => {
    if (entity === "Organization")
      await transaction.organization.update({ where: { id }, data: { deletedAt: new Date() } });
    if (entity === "ExamCenter")
      await transaction.examCenter.update({ where: { id }, data: { deletedAt: new Date() } });
    if (entity === "ExamLevel")
      await transaction.examLevel.update({ where: { id }, data: { deletedAt: new Date() } });
    if (entity === "AcademicYear")
      await transaction.academicYear.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: AuditAction.SOFT_DELETE,
      entityType: entity,
      entityId: id,
      beforeJson: { id },
    });
  });
  revalidateMasterData();
}

export const deleteOrganizationAction = softDelete.bind(null, "Organization");
export const deleteExamCenterAction = softDelete.bind(null, "ExamCenter");
export const deleteExamLevelAction = softDelete.bind(null, "ExamLevel");
export const deleteAcademicYearAction = softDelete.bind(null, "AcademicYear");
