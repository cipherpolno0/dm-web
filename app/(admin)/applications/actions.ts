"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/authorization/server";
import { prepareExcelFile } from "@/lib/exam/excel";
import {
  approveApplicationAndAssignSeat,
  importApplicationsFromExcel,
  submitManualApplication,
} from "@/lib/exam/workflow";
import { applicationIdSchema, applicationInputSchema } from "@/lib/validation/exam";

function revalidateApplications() {
  revalidatePath("/applications");
}

export async function submitApplicationAction(formData: FormData) {
  const actor = await requireRole(["school"]);
  const input = applicationInputSchema.parse({
    nationalId: formData.get("nationalId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    schoolCode: formData.get("schoolCode"),
    examCenterCode: formData.get("examCenterCode"),
    examProgramCode: formData.get("examProgramCode"),
  });
  await submitManualApplication(actor, input);
  revalidateApplications();
}

export async function importApplicationsAction(formData: FormData) {
  const actor = await requireRole(["school"]);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("กรุณาเลือกไฟล์ Excel");

  const summary = await importApplicationsFromExcel(actor, await prepareExcelFile(file));
  if (summary.issues.length > 0) {
    throw new Error(
      `ไม่บันทึกใบสมัครทั้งชุด พบข้อผิดพลาด: ${summary.issues
        .map((item) => `แถว ${item.rowNumber} ${item.message}`)
        .join("; ")}`,
    );
  }
  revalidateApplications();
}

export async function approveApplicationAction(applicationId: string) {
  const actor = await requireRole(["super_admin", "field_officer"]);
  await approveApplicationAndAssignSeat(actor, applicationIdSchema.parse(applicationId));
  revalidateApplications();
}
