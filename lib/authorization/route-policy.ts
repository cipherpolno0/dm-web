import type { AppRole } from "@/lib/authorization/roles";

type AdminRouteRule = Readonly<{
  prefix: string;
  roles: readonly AppRole[];
}>;

const adminRouteRules: readonly AdminRouteRule[] = [
  { prefix: "/admin/users", roles: ["super_admin"] },
  { prefix: "/admin/settings", roles: ["super_admin"] },
  { prefix: "/admin/field", roles: ["super_admin", "field_officer"] },
  { prefix: "/admin/exam-centers", roles: ["super_admin", "field_officer"] },
  { prefix: "/admin/exam-sessions", roles: ["super_admin", "field_officer"] },
  { prefix: "/admin/content", roles: ["super_admin", "field_officer"] },
  { prefix: "/admin/media", roles: ["super_admin", "field_officer"] },
  { prefix: "/admin/master-data", roles: ["super_admin", "field_officer"] },
  { prefix: "/content", roles: ["super_admin", "field_officer"] },
  { prefix: "/media", roles: ["super_admin", "field_officer"] },
  { prefix: "/master-data", roles: ["super_admin", "field_officer"] },
  { prefix: "/admin/school", roles: ["super_admin", "school"] },
  { prefix: "/admin/applications", roles: ["super_admin", "field_officer", "school"] },
  { prefix: "/admin/results-management", roles: ["super_admin"] },
  { prefix: "/applications", roles: ["super_admin", "field_officer", "school"] },
  { prefix: "/results-management", roles: ["super_admin"] },
  { prefix: "/dashboard", roles: ["super_admin", "field_officer", "school"] },
  { prefix: "/admin", roles: ["super_admin"] },
];

export function isRoleAllowedForAdminPath(role: AppRole, pathname: string) {
  const rule = adminRouteRules.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return Boolean(rule?.roles.includes(role));
}
