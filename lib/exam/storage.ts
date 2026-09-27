import { randomUUID } from "node:crypto";

import { getMediaBucket, getPrivateStorageClient } from "@/lib/storage/supabase";

import type { PreparedExcelFile } from "@/lib/exam/excel";

export type StoredImportFile = Readonly<{
  bucket: string;
  objectKey: string;
}>;

export async function storeImportSource(
  namespace: "applications" | "scores",
  prepared: PreparedExcelFile,
): Promise<StoredImportFile> {
  const bucket = getMediaBucket();
  const objectKey = `imports/${namespace}/${new Date().getUTCFullYear()}/${randomUUID()}.xlsx`;
  const { error } = await getPrivateStorageClient()
    .storage.from(bucket)
    .upload(objectKey, prepared.bytes, { contentType: prepared.mimeType, upsert: false });

  if (error) throw new Error("ไม่สามารถเก็บไฟล์ต้นฉบับในคลังข้อมูลส่วนตัวได้");
  return { bucket, objectKey };
}

export async function removeStoredImportSource(file: StoredImportFile) {
  await getPrivateStorageClient().storage.from(file.bucket).remove([file.objectKey]);
}
