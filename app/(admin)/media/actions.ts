"use server";

import { randomUUID } from "node:crypto";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";
import { inspectMediaFile } from "@/lib/media/inspect";
import { getMediaBucket, getPrivateStorageClient } from "@/lib/storage/supabase";
import { mediaInputSchema } from "@/lib/validation/cms";

const cmsRoles = ["super_admin", "field_officer"] as const;

export async function uploadMediaAction(formData: FormData) {
  const actor = await requireRole(cmsRoles);
  const input = mediaInputSchema.parse({ category: formData.get("category") });
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("กรุณาเลือกไฟล์ที่ต้องการอัปโหลด");
  }

  const inspected = await inspectMediaFile(file);
  const bucket = getMediaBucket();
  const objectKey = `cms/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${inspected.extension}`;
  const storage = getPrivateStorageClient();
  const upload = await storage.storage.from(bucket).upload(objectKey, inspected.bytes, {
    contentType: inspected.mimeType,
    upsert: false,
  });

  if (upload.error) {
    throw new Error("ไม่สามารถอัปโหลดไฟล์ไปยังคลังส่วนตัวได้");
  }

  try {
    await getPrisma().$transaction(async (transaction) => {
      const media = await transaction.mediaFile.create({
        data: {
          bucket,
          objectKey,
          originalName: file.name.slice(0, 255),
          category: input.category,
          mimeType: inspected.mimeType,
          sizeBytes: file.size,
          sha256: inspected.sha256,
          uploadedById: actor.id,
        },
      });
      await writeAuditLog(transaction, {
        actorId: actor.id,
        action: AuditAction.UPLOAD,
        entityType: "MediaFile",
        entityId: media.id,
        afterJson: {
          category: media.category,
          mimeType: media.mimeType,
          sizeBytes: media.sizeBytes,
          sha256: media.sha256,
        },
      });
    });
  } catch (error) {
    await storage.storage.from(bucket).remove([objectKey]);
    throw error;
  }

  revalidatePath("/media");
}

export async function deleteMediaAction(id: string) {
  const actor = await requireRole(cmsRoles);
  const prisma = getPrisma();
  const current = await prisma.mediaFile.findFirst({ where: { id, deletedAt: null } });

  if (!current) {
    throw new Error("ไม่พบไฟล์ที่ต้องการลบ");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.mediaFile.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog(transaction, {
      actorId: actor.id,
      action: AuditAction.SOFT_DELETE,
      entityType: "MediaFile",
      entityId: id,
      beforeJson: {
        originalName: current.originalName,
        bucket: current.bucket,
        objectKey: current.objectKey,
      },
    });
  });

  revalidatePath("/media");
}
