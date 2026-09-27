import { AuditAction, Prisma } from "@prisma/client";

type AuditEntry = Readonly<{
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeJson?: Prisma.InputJsonObject;
  afterJson?: Prisma.InputJsonObject;
}>;

export async function writeAuditLog(transaction: Prisma.TransactionClient, entry: AuditEntry) {
  await transaction.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      beforeJson: entry.beforeJson,
      afterJson: entry.afterJson,
    },
  });
}
