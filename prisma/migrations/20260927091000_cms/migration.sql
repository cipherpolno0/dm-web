CREATE TYPE "MediaCategory" AS ENUM ('FORM', 'EXAM', 'GUIDE');
CREATE TYPE "MediaScanStatus" AS ENUM ('PENDING', 'CLEAN', 'REJECTED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'SOFT_DELETE', 'UPLOAD');

ALTER TABLE "AcademicYear" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "ExamLevel" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Announcement" ADD COLUMN "bodyHtml" TEXT NOT NULL DEFAULT '';

CREATE TABLE "MediaFile" (
  "id" UUID NOT NULL,
  "bucket" VARCHAR(100) NOT NULL,
  "objectKey" VARCHAR(512) NOT NULL,
  "originalName" VARCHAR(255) NOT NULL,
  "category" "MediaCategory" NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "sha256" VARCHAR(64) NOT NULL,
  "scanStatus" "MediaScanStatus" NOT NULL DEFAULT 'PENDING',
  "uploadedById" UUID NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL,
  "actorId" UUID,
  "action" "AuditAction" NOT NULL,
  "entityType" VARCHAR(100) NOT NULL,
  "entityId" VARCHAR(100) NOT NULL,
  "beforeJson" JSONB,
  "afterJson" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaFile_bucket_objectKey_key" ON "MediaFile"("bucket", "objectKey");
CREATE INDEX "MediaFile_category_deletedAt_createdAt_idx" ON "MediaFile"("category", "deletedAt", "createdAt");
CREATE INDEX "MediaFile_originalName_idx" ON "MediaFile"("originalName");
CREATE INDEX "AuditLog_entityType_entityId_occurredAt_idx" ON "AuditLog"("entityType", "entityId", "occurredAt");
CREATE INDEX "AuditLog_actorId_occurredAt_idx" ON "AuditLog"("actorId", "occurredAt");

ALTER TABLE "MediaFile"
  ADD CONSTRAINT "MediaFile_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
