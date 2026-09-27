export const userRoles = ["super_admin", "field_officer", "school", "guest"] as const;

export type AppRole = (typeof userRoles)[number];

export const staffRoles = ["super_admin", "field_officer", "school"] as const;

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && userRoles.includes(value as AppRole);
}

export function roleHomePath(role: AppRole) {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "field_officer":
      return "/admin/field";
    case "school":
      return "/admin/school";
    case "guest":
      return "/";
  }
}
