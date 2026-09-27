CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED_TO_CENTER', 'CENTER_RETURNED', 'CENTER_APPROVED');
CREATE TYPE "ApplicationSource" AS ENUM ('MANUAL', 'EXCEL_IMPORT');
CREATE TYPE "ImportBatchStatus" AS ENUM ('VALIDATING', 'REJECTED', 'READY', 'COMMITTED');

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'IMPORT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'APPROVE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PUBLISH';

ALTER TABLE "ResultPublication" ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false;
DROP INDEX IF EXISTS "ResultPublication_status_publishedAt_idx";
CREATE INDEX "ResultPublication_status_is_published_publishedAt_idx"
  ON "ResultPublication"("status", "is_published", "publishedAt");

CREATE TABLE "Applicant" (
  "id" UUID NOT NULL,
  "nationalIdHash" CHAR(64) NOT NULL,
  "nationalIdLast4" CHAR(4) NOT NULL,
  "firstName" VARCHAR(150) NOT NULL,
  "lastName" VARCHAR(150) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationImportBatch" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "sourceFileName" VARCHAR(255) NOT NULL,
  "sourceSha256" CHAR(64) NOT NULL,
  "bucket" VARCHAR(100) NOT NULL,
  "objectKey" VARCHAR(512) NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "status" "ImportBatchStatus" NOT NULL DEFAULT 'VALIDATING',
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "acceptedRows" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamApplication" (
  "id" UUID NOT NULL,
  "applicantId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "examCenterId" UUID NOT NULL,
  "examProgramId" UUID NOT NULL,
  "applicationImportBatchId" UUID,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "source" "ApplicationSource" NOT NULL DEFAULT 'MANUAL',
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "returnedReason" VARCHAR(1000),
  "createdById" UUID NOT NULL,
  "approvedById" UUID,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeatSequence" (
  "id" UUID NOT NULL,
  "examCenterId" UUID NOT NULL,
  "examProgramId" UUID NOT NULL,
  "nextSequence" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeatSequence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeatAssignment" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "examCenterId" UUID NOT NULL,
  "examProgramId" UUID NOT NULL,
  "sequenceNo" INTEGER NOT NULL,
  "seatNo" VARCHAR(80) NOT NULL,
  "issuedById" UUID NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SeatAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScoreImportBatch" (
  "id" UUID NOT NULL,
  "examProgramId" UUID NOT NULL,
  "sourceFileName" VARCHAR(255) NOT NULL,
  "sourceSha256" CHAR(64) NOT NULL,
  "bucket" VARCHAR(100) NOT NULL,
  "objectKey" VARCHAR(512) NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "status" "ImportBatchStatus" NOT NULL DEFAULT 'VALIDATING',
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "validRows" INTEGER NOT NULL DEFAULT 0,
  "committedAt" TIMESTAMP(3),
  "createdById" UUID NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoreImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScoreImportIssue" (
  "id" UUID NOT NULL,
  "scoreImportBatchId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "message" VARCHAR(1000) NOT NULL,
  "rawRow" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoreImportIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScoreImportRow" (
  "id" UUID NOT NULL,
  "scoreImportBatchId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "seatNo" VARCHAR(80) NOT NULL,
  "applicationId" UUID NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "outcome" VARCHAR(100) NOT NULL,
  CONSTRAINT "ScoreImportRow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScoreRecord" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "currentRevisionId" UUID NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "outcome" VARCHAR(100) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScoreRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScoreRevision" (
  "id" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "scoreImportBatchId" UUID NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "outcome" VARCHAR(100) NOT NULL,
  "importedById" UUID NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoreRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Applicant_nationalIdHash_key" ON "Applicant"("nationalIdHash");
CREATE INDEX "Applicant_lastName_firstName_idx" ON "Applicant"("lastName", "firstName");
CREATE INDEX "Applicant_deletedAt_idx" ON "Applicant"("deletedAt");
CREATE UNIQUE INDEX "ApplicationImportBatch_bucket_objectKey_key" ON "ApplicationImportBatch"("bucket", "objectKey");
CREATE INDEX "ApplicationImportBatch_organizationId_createdAt_idx" ON "ApplicationImportBatch"("organizationId", "createdAt");
CREATE INDEX "ApplicationImportBatch_status_createdAt_idx" ON "ApplicationImportBatch"("status", "createdAt");
CREATE UNIQUE INDEX "ExamApplication_applicantId_examProgramId_key" ON "ExamApplication"("applicantId", "examProgramId");
CREATE INDEX "ExamApplication_organizationId_status_createdAt_idx" ON "ExamApplication"("organizationId", "status", "createdAt");
CREATE INDEX "ExamApplication_examCenterId_status_createdAt_idx" ON "ExamApplication"("examCenterId", "status", "createdAt");
CREATE INDEX "ExamApplication_examProgramId_status_idx" ON "ExamApplication"("examProgramId", "status");
CREATE UNIQUE INDEX "SeatSequence_examCenterId_examProgramId_key" ON "SeatSequence"("examCenterId", "examProgramId");
CREATE UNIQUE INDEX "SeatAssignment_applicationId_key" ON "SeatAssignment"("applicationId");
CREATE UNIQUE INDEX "SeatAssignment_seatNo_key" ON "SeatAssignment"("seatNo");
CREATE UNIQUE INDEX "SeatAssignment_examCenterId_examProgramId_sequenceNo_key" ON "SeatAssignment"("examCenterId", "examProgramId", "sequenceNo");
CREATE INDEX "SeatAssignment_examProgramId_seatNo_idx" ON "SeatAssignment"("examProgramId", "seatNo");
CREATE UNIQUE INDEX "ScoreImportBatch_bucket_objectKey_key" ON "ScoreImportBatch"("bucket", "objectKey");
CREATE INDEX "ScoreImportBatch_examProgramId_status_createdAt_idx" ON "ScoreImportBatch"("examProgramId", "status", "createdAt");
CREATE INDEX "ScoreImportIssue_scoreImportBatchId_rowNumber_idx" ON "ScoreImportIssue"("scoreImportBatchId", "rowNumber");
CREATE UNIQUE INDEX "ScoreImportRow_scoreImportBatchId_rowNumber_key" ON "ScoreImportRow"("scoreImportBatchId", "rowNumber");
CREATE INDEX "ScoreImportRow_scoreImportBatchId_seatNo_idx" ON "ScoreImportRow"("scoreImportBatchId", "seatNo");
CREATE UNIQUE INDEX "ScoreRecord_applicationId_key" ON "ScoreRecord"("applicationId");
CREATE INDEX "ScoreRecord_outcome_idx" ON "ScoreRecord"("outcome");
CREATE INDEX "ScoreRevision_applicationId_importedAt_idx" ON "ScoreRevision"("applicationId", "importedAt");
CREATE INDEX "ScoreRevision_scoreImportBatchId_idx" ON "ScoreRevision"("scoreImportBatchId");

ALTER TABLE "ApplicationImportBatch" ADD CONSTRAINT "ApplicationImportBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApplicationImportBatch" ADD CONSTRAINT "ApplicationImportBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_examCenterId_fkey" FOREIGN KEY ("examCenterId") REFERENCES "ExamCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_examProgramId_fkey" FOREIGN KEY ("examProgramId") REFERENCES "ExamProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_applicationImportBatchId_fkey" FOREIGN KEY ("applicationImportBatchId") REFERENCES "ApplicationImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamApplication" ADD CONSTRAINT "ExamApplication_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SeatSequence" ADD CONSTRAINT "SeatSequence_examCenterId_fkey" FOREIGN KEY ("examCenterId") REFERENCES "ExamCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeatSequence" ADD CONSTRAINT "SeatSequence_examProgramId_fkey" FOREIGN KEY ("examProgramId") REFERENCES "ExamProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ExamApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_examCenterId_fkey" FOREIGN KEY ("examCenterId") REFERENCES "ExamCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_examProgramId_fkey" FOREIGN KEY ("examProgramId") REFERENCES "ExamProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScoreImportBatch" ADD CONSTRAINT "ScoreImportBatch_examProgramId_fkey" FOREIGN KEY ("examProgramId") REFERENCES "ExamProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScoreImportBatch" ADD CONSTRAINT "ScoreImportBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScoreImportIssue" ADD CONSTRAINT "ScoreImportIssue_scoreImportBatchId_fkey" FOREIGN KEY ("scoreImportBatchId") REFERENCES "ScoreImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScoreImportRow" ADD CONSTRAINT "ScoreImportRow_scoreImportBatchId_fkey" FOREIGN KEY ("scoreImportBatchId") REFERENCES "ScoreImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScoreRecord" ADD CONSTRAINT "ScoreRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ExamApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScoreRevision" ADD CONSTRAINT "ScoreRevision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ExamApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScoreRevision" ADD CONSTRAINT "ScoreRevision_scoreImportBatchId_fkey" FOREIGN KEY ("scoreImportBatchId") REFERENCES "ScoreImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScoreRevision" ADD CONSTRAINT "ScoreRevision_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
