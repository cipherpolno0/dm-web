-- Create the master data that later migrations reference. This migration must
-- precede auth_rbac so a fresh database can apply the complete history.
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED');
CREATE TYPE "ResultPublicationStatus" AS ENUM ('PREPARING', 'PUBLISHED', 'UNPUBLISHED', 'FAILED');

CREATE TABLE "AcademicYear" (
  "id" UUID NOT NULL,
  "yearBe" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamType" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "nameTh" TEXT NOT NULL,
  CONSTRAINT "ExamType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamLevel" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "nameTh" TEXT NOT NULL,
  CONSTRAINT "ExamLevel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Organization" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "nameTh" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamCenter" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "nameTh" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ExamCenter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamProgram" (
  "id" UUID NOT NULL,
  "academicYearId" UUID NOT NULL,
  "examTypeId" UUID NOT NULL,
  "examLevelId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "examDate" TIMESTAMP(3),
  "resultPublishAt" TIMESTAMP(3),
  CONSTRAINT "ExamProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Announcement" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "summary" TEXT,
  "bodyMarkdown" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "unpublishedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarEvent" (
  "id" UUID NOT NULL,
  "academicYearId" UUID NOT NULL,
  "examProgramId" UUID,
  "title" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResultPublication" (
  "id" UUID NOT NULL,
  "examProgramId" UUID NOT NULL,
  "publicationNo" INTEGER NOT NULL,
  "status" "ResultPublicationStatus" NOT NULL DEFAULT 'PREPARING',
  "publishedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ResultPublication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResultPublicProjection" (
  "id" UUID NOT NULL,
  "resultPublicationId" UUID NOT NULL,
  "academicYearId" UUID NOT NULL,
  "displayName" TEXT NOT NULL,
  "seatNo" TEXT,
  "examTypeCode" TEXT NOT NULL,
  "examLevelCode" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "publicOrganizationName" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "projectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResultPublicProjection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicYear_yearBe_key" ON "AcademicYear"("yearBe");
CREATE UNIQUE INDEX "ExamType_code_key" ON "ExamType"("code");
CREATE UNIQUE INDEX "ExamLevel_code_key" ON "ExamLevel"("code");
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");
CREATE INDEX "Organization_deletedAt_nameTh_idx" ON "Organization"("deletedAt", "nameTh");
CREATE UNIQUE INDEX "ExamCenter_code_key" ON "ExamCenter"("code");
CREATE INDEX "ExamCenter_deletedAt_nameTh_idx" ON "ExamCenter"("deletedAt", "nameTh");
CREATE UNIQUE INDEX "ExamProgram_code_key" ON "ExamProgram"("code");
CREATE UNIQUE INDEX "ExamProgram_academicYearId_examTypeId_examLevelId_key" ON "ExamProgram"("academicYearId", "examTypeId", "examLevelId");
CREATE INDEX "ExamProgram_academicYearId_examDate_idx" ON "ExamProgram"("academicYearId", "examDate");
CREATE UNIQUE INDEX "Announcement_slug_key" ON "Announcement"("slug");
CREATE INDEX "Announcement_status_publishedAt_idx" ON "Announcement"("status", "publishedAt");
CREATE INDEX "CalendarEvent_isPublic_startsAt_idx" ON "CalendarEvent"("isPublic", "startsAt");
CREATE UNIQUE INDEX "ResultPublication_examProgramId_publicationNo_key" ON "ResultPublication"("examProgramId", "publicationNo");
CREATE INDEX "ResultPublication_status_publishedAt_idx" ON "ResultPublication"("status", "publishedAt");
CREATE INDEX "ResultPublicProjection_resultPublicationId_isActive_idx" ON "ResultPublicProjection"("resultPublicationId", "isActive");
CREATE INDEX "ResultPublicProjection_academicYearId_examTypeCode_examLevelCode_isActive_idx" ON "ResultPublicProjection"("academicYearId", "examTypeCode", "examLevelCode", "isActive");
CREATE INDEX "ResultPublicProjection_seatNo_idx" ON "ResultPublicProjection"("seatNo");
CREATE INDEX "ResultPublicProjection_displayName_idx" ON "ResultPublicProjection"("displayName");

ALTER TABLE "ExamProgram" ADD CONSTRAINT "ExamProgram_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamProgram" ADD CONSTRAINT "ExamProgram_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExamProgram" ADD CONSTRAINT "ExamProgram_examLevelId_fkey" FOREIGN KEY ("examLevelId") REFERENCES "ExamLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_examProgramId_fkey" FOREIGN KEY ("examProgramId") REFERENCES "ExamProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResultPublication" ADD CONSTRAINT "ResultPublication_examProgramId_fkey" FOREIGN KEY ("examProgramId") REFERENCES "ExamProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResultPublicProjection" ADD CONSTRAINT "ResultPublicProjection_resultPublicationId_fkey" FOREIGN KEY ("resultPublicationId") REFERENCES "ResultPublication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResultPublicProjection" ADD CONSTRAINT "ResultPublicProjection_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
