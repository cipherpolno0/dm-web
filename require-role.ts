import type { AppRole } from "@/lib/authorization/roles";

export type AuthPrincipal = Readonly<{
  id: string;
  role: AppRole;
  organizationId: string | null;
  examCenterId: string | null;
}>;

export type AuthorizationScope = Readonly<{
  organizationId?: string;
  examCenterId?: string;
}>;

export class AuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export function assertRole(
  principal: AuthPrincipal | null,
  allowedRoles: readonly AppRole[],
  scope: AuthorizationScope = {},
) {
  if (!principal) {
    throw new AuthorizationError(401, "Authentication is required.");
  }

  if (!allowedRoles.includes(principal.role)) {
    throw new AuthorizationError(403, "You do not have permission for this action.");
  }

  if (principal.role === "super_admin") {
    return principal;
  }

  if (scope.organizationId && principal.organizationId !== scope.organizationId) {
    throw new AuthorizationError(403, "Organization scope does not match.");
  }

  if (scope.examCenterId && principal.examCenterId !== scope.examCenterId) {
    throw new AuthorizationError(403, "Exam center scope does not match.");
  }

  return principal;
}

export async function requireRole(
  allowedRoles: readonly AppRole[],
  getPrincipal: () => Promise<AuthPrincipal | null>,
  scope: AuthorizationScope = {},
) {
  return assertRole(await getPrincipal(), allowedRoles, scope);
}
