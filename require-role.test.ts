import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorizationError,
  requireRole,
  type AuthPrincipal,
} from "../lib/authorization/require-role";
import { isRoleAllowedForAdminPath } from "../lib/authorization/route-policy";
import type { AppRole } from "../lib/authorization/roles";

function principal(role: AppRole): AuthPrincipal {
  return {
    id: `${role}-id`,
    role,
    organizationId: role === "school" ? "organization-a" : null,
    examCenterId: role === "field_officer" ? "center-a" : null,
  };
}

function getPrincipal(role: AppRole) {
  return async () => principal(role);
}

test("super_admin is allowed to access the central admin route", async () => {
  const actor = await requireRole(["super_admin"], getPrincipal("super_admin"));

  assert.equal(actor.role, "super_admin");
  assert.equal(isRoleAllowedForAdminPath("super_admin", "/admin/users"), true);
});

test("field_officer is blocked from super-admin-only routes", async () => {
  await assert.rejects(
    () => requireRole(["super_admin"], getPrincipal("field_officer")),
    (error: unknown) => error instanceof AuthorizationError && error.status === 403,
  );
  assert.equal(isRoleAllowedForAdminPath("field_officer", "/admin/users"), false);
  assert.equal(isRoleAllowedForAdminPath("field_officer", "/admin/exam-centers"), true);
});

test("school is blocked from field-officer routes", async () => {
  await assert.rejects(
    () => requireRole(["super_admin", "field_officer"], getPrincipal("school")),
    (error: unknown) => error instanceof AuthorizationError && error.status === 403,
  );
  assert.equal(isRoleAllowedForAdminPath("school", "/admin/exam-centers"), false);
  assert.equal(isRoleAllowedForAdminPath("school", "/admin/applications"), true);
});

test("guest is blocked from every admin route", async () => {
  await assert.rejects(
    () => requireRole(["super_admin", "field_officer", "school"], getPrincipal("guest")),
    (error: unknown) => error instanceof AuthorizationError && error.status === 403,
  );
  assert.equal(isRoleAllowedForAdminPath("guest", "/admin"), false);
});

test("requireRole blocks mismatched organization and exam-center scope", async () => {
  await assert.rejects(
    () => requireRole(["school"], getPrincipal("school"), { organizationId: "organization-b" }),
    (error: unknown) => error instanceof AuthorizationError && error.status === 403,
  );
  await assert.rejects(
    () =>
      requireRole(["field_officer"], getPrincipal("field_officer"), { examCenterId: "center-b" }),
    (error: unknown) => error instanceof AuthorizationError && error.status === 403,
  );
});
