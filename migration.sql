CREATE TYPE "ResultNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');

ALTER TABLE "Organization" ADD COLUMN "notificationEmail" VARCHAR(320);
ALTER TABLE "ResultPublicProjection" ADD COLUMN "organizationId" UUID;
ALTER TABLE "ResultPublicProjection" ADD COLUMN "examCenterId" UUID;

CREATE TABLE "ResultNotificationJob" (
  "id" UUID NOT NULL,
  "resultPublicationId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "recipientEmail" VARCHAR(320),
  "idempotencyKey" VARCHAR(255) NOT NULL,
  "status" "ResultNotificationStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" VARCHAR(1000),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResultNotificationJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResultNotificationJob_idempotencyKey_key" ON "ResultNotificationJob"("idempotencyKey");
CREATE INDEX "ResultNotificationJob_status_nextAttemptAt_idx" ON "ResultNotificationJob"("status", "nextAttemptAt");
CREATE INDEX "ResultNotificationJob_resultPublicationId_organizationId_idx" ON "ResultNotificationJob"("resultPublicationId", "organizationId");
CREATE INDEX "ResultPublicProjection_organizationId_academicYearId_isActive_idx" ON "ResultPublicProjection"("organizationId", "academicYearId", "isActive");
CREATE INDEX "ResultPublicProjection_examCenterId_academicYearId_isActive_idx" ON "ResultPublicProjection"("examCenterId", "academicYearId", "isActive");

ALTER TABLE "ResultPublicProjection" ADD CONSTRAINT "ResultPublicProjection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResultPublicProjection" ADD CONSTRAINT "ResultPublicProjection_examCenterId_fkey" FOREIGN KEY ("examCenterId") REFERENCES "ExamCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResultNotificationJob" ADD CONSTRAINT "ResultNotificationJob_resultPublicationId_fkey" FOREIGN KEY ("resultPublicationId") REFERENCES "ResultPublication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResultNotificationJob" ADD CONSTRAINT "ResultNotificationJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
