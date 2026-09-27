CREATE TYPE "UserRole" AS ENUM ('super_admin', 'field_officer', 'school', 'guest');
CREATE TYPE "AuthAuditEvent" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "username" VARCHAR(100) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "organizationId" UUID,
  "examCenterId" UUID,
  "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthAuditLog" (
  "id" UUID NOT NULL,
  "userId" UUID,
  "usernameAttempt" VARCHAR(100) NOT NULL,
  "event" "AuthAuditEvent" NOT NULL,
  "failureReason" TEXT,
  "ipHash" VARCHAR(128),
  "userAgent" VARCHAR(512),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_role_isActive_deletedAt_idx" ON "User"("role", "isActive", "deletedAt");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_examCenterId_idx" ON "User"("examCenterId");
CREATE INDEX "AuthAuditLog_userId_createdAt_idx" ON "AuthAuditLog"("userId", "createdAt");
CREATE INDEX "AuthAuditLog_usernameAttempt_createdAt_idx" ON "AuthAuditLog"("usernameAttempt", "createdAt");
CREATE INDEX "AuthAuditLog_event_createdAt_idx" ON "AuthAuditLog"("event", "createdAt");

ALTER TABLE "User"
  ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
  ADD CONSTRAINT "User_examCenterId_fkey"
  FOREIGN KEY ("examCenterId") REFERENCES "ExamCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuthAuditLog"
  ADD CONSTRAINT "AuthAuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
