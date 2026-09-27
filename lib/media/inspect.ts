import { createHash } from "node:crypto";

import { fileTypeFromBuffer } from "file-type";

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

const extensionForMime: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type InspectedMedia = Readonly<{
  bytes: Uint8Array;
  mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  extension: string;
  sha256: string;
}>;

export async function inspectMediaFile(file: File): Promise<InspectedMedia> {
  if (file.size === 0 || file.size > MAX_MEDIA_BYTES) {
    throw new Error("ไฟล์ต้องมีขนาดไม่เกิน 20 MB");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(bytes);

  if (!detected || !allowedMimeTypes.has(detected.mime)) {
    throw new Error("ระบบรองรับเฉพาะ PDF, JPEG, PNG และ WebP ที่ตรวจสอบชนิดไฟล์ได้");
  }

  const mimeType = detected.mime as InspectedMedia["mimeType"];

  if (file.type && file.type !== mimeType) {
    throw new Error("ชนิดไฟล์ที่ระบุไม่ตรงกับเนื้อหาไฟล์");
  }

  return {
    bytes,
    mimeType,
    extension: extensionForMime[mimeType],
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
