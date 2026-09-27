import { auth } from "@/auth";
import {
  assertRole,
  type AuthorizationScope,
  type AuthPrincipal,
} from "@/lib/authorization/require-role";
import type { AppRole } from "@/lib/authorization/roles";

async function getPrincipal(): Promise<AuthPrincipal | null> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.role) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
    organizationId: user.organizationId ?? null,
    examCenterId: user.examCenterId ?? null,
  };
}

export async function requireRole(
  allowedRoles: readonly AppRole[],
  scope: AuthorizationScope = {},
) {
  return assertRole(await getPrincipal(), allowedRoles, scope);
}
