"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { requireRole } from "@/lib/authorization/server";
import { prepareExcelFile } from "@/lib/exam/excel";
import { commitScoreImport, previewScoreImport, publishResults } from "@/lib/exam/workflow";
import { triggerResultNotifications } from "@/lib/jobs/inngest";
import { examProgramIdSchema, scoreImportBatchIdSchema } from "@/lib/validation/exam";

export async function previewScoreImportAction(formData: FormData) {
  const actor = await requireRole(["super_admin"]);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("กรุณาเลือกไฟล์ Excel");
  const examProgramId = examProgramIdSchema.parse(formData.get("examProgramId"));
  const summary = await previewScoreImport(actor, examProgramId, await prepareExcelFile(file));
  revalidatePath("/results-management");
  redirect(`/results-management?batch=${summary.batchId}`);
}

export async function commitScoreImportAction(scoreImportBatchId: string) {
  const actor = await requireRole(["super_admin"]);
  await commitScoreImport(actor, scoreImportBatchIdSchema.parse(scoreImportBatchId));
  revalidatePath("/results-management");
}

export async function publishResultsAction(examProgramId: string) {
  const actor = await requireRole(["super_admin"]);
  const publication = await publishResults(actor, examProgramIdSchema.parse(examProgramId));
  after(() =>
    triggerResultNotifications({
      name: "exam/results.published",
      data: {
        publicationId: publication.publicationId,
        notificationJobIds: publication.notificationJobIds,
      },
    }),
  );
  revalidatePath("/results-management");
  revalidatePath("/results");
}
