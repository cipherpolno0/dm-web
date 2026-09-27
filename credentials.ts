import { createHash } from "node:crypto";

import { AuthAuditEvent } from "@prisma/client";
import bcrypt from "bcryptjs";

import { getPrisma } from "@/lib/db/prisma";
import { isAppRole, type AppRole } from "@/lib/authorization/roles";

const MAX_LOGIN_FAILURES = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const PASSWORD_COST = 12;
const DUMMY_PASSWORD_HASH = "$2b$12$8E2nB6BcOehldkTJRYbNwOMv2PXk0RggS9oBzZUsOy6suMs7E0cwO";

type LoginRequest = Pick<Request, "headers">;

export type AuthenticatedUser = Readonly<{
  id: string;
  name: string;
  role: AppRole;
  organizationId: string | null;
  examCenterId: string | null;
}>;

type RequestAuditContext = Readonly<{
  ipHash: string | null;
  userAgent: string | null;
}>;

function normalizeUsername(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function requestAuditContext(request: LoginRequest): RequestAuditContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? null;
  const secret = process.env.AUTH_AUDIT_HASH_SECRET ?? process.env.AUTH_SECRET;

  return {
    ipHash: ip && secret ? createHash("sha256").update(`${secret}:${ip}`).digest("hex") : null,
    userAgent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
  };
}

async function createAuditLog(
  usernameAttempt: string,
  event: AuthAuditEvent,
  context: RequestAuditContext,
  options: Readonly<{ userId?: string; failureReason?: string }> = {},
) {
  await getPrisma().authAuditLog.create({
    data: {
      usernameAttempt,
      event,
      userId: options.userId,
      failureReason: options.failureReason,
      ipHash: context.ipHash,
      userAgent: context.userAgent,
    },
  });
}

export async function hashPassword(plainTextPassword: string) {
  return bcrypt.hash(plainTextPassword, PASSWORD_COST);
}

export async function authenticateWithPassword(
  rawUsername: string,
  password: string,
  request: LoginRequest,
): Promise<AuthenticatedUser | null> {
  const username = normalizeUsername(rawUsername);
  const context = requestAuditContext(request);

  if (!username || username.length > 100 || !password || password.length > 128) {
    await bcrypt.compare(password.slice(0, 128), DUMMY_PASSWORD_HASH);
    await createAuditLog(username.slice(0, 100), AuthAuditEvent.LOGIN_FAILURE, context, {
      failureReason: "INVALID_CREDENTIALS",
    });
    return null;
  }

  const prisma = getPrisma();
  let user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    await createAuditLog(username, AuthAuditEvent.LOGIN_FAILURE, context, {
      failureReason: "INVALID_CREDENTIALS",
    });
    return null;
  }

  const now = new Date();

  if (user.lockedUntil && user.lockedUntil > now) {
    await createAuditLog(username, AuthAuditEvent.LOGIN_FAILURE, context, {
      userId: user.id,
      failureReason: "ACCOUNT_LOCKED",
    });
    return null;
  }

  if (user.lockedUntil && user.lockedUntil <= now) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);

  if (!matches || !user.isActive || user.deletedAt) {
    if (!matches) {
      await prisma.$transaction(async (transaction) => {
        const updatedUser = await transaction.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: { increment: 1 } },
        });
        const shouldLock = updatedUser.failedLoginAttempts >= MAX_LOGIN_FAILURES;

        if (shouldLock) {
          await transaction.user.update({
            where: { id: user.id },
            data: { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
          });
        }

        await transaction.authAuditLog.create({
          data: {
            usernameAttempt: username,
            event: AuthAuditEvent.LOGIN_FAILURE,
            userId: user.id,
            failureReason: shouldLock ? "ACCOUNT_LOCKED" : "INVALID_CREDENTIALS",
            ipHash: context.ipHash,
            userAgent: context.userAgent,
          },
        });
      });
    } else {
      await createAuditLog(username, AuthAuditEvent.LOGIN_FAILURE, context, {
        userId: user.id,
        failureReason: "ACCOUNT_INACTIVE",
      });
    }

    return null;
  }

  if (!isAppRole(user.role)) {
    await createAuditLog(username, AuthAuditEvent.LOGIN_FAILURE, context, {
      userId: user.id,
      failureReason: "INVALID_ROLE",
    });
    return null;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    }),
    prisma.authAuditLog.create({
      data: {
        usernameAttempt: username,
        event: AuthAuditEvent.LOGIN_SUCCESS,
        userId: user.id,
        ipHash: context.ipHash,
        userAgent: context.userAgent,
      },
    }),
  ]);

  return {
    id: user.id,
    name: user.username,
    role: user.role,
    organizationId: user.organizationId,
    examCenterId: user.examCenterId,
  };
}
