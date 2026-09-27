import { assertRole, type AuthPrincipal } from "@/lib/authorization/require-role";

export type ReportScope = Readonly<{
  organizationId?: string;
  examCenterId?: string;
}>;

export function resolveReportScope(
  actor: AuthPrincipal,
  requestedOrganizationId?: string | null,
): ReportScope {
  assertRole(actor, ["super_admin", "field_officer", "school"]);

  if (actor.role === "school") {
    if (!actor.organizationId) throw new Error("บัญชีสำนักเรียนยังไม่ได้ผูกกับสำนักเรียน");
    if (requestedOrganizationId && requestedOrganizationId !== actor.organizationId) {
      throw new Error("ไม่มีสิทธิ์ดูหรือส่งออกรายงานของสำนักเรียนอื่น");
    }
    return { organizationId: actor.organizationId };
  }

  if (actor.role === "field_officer") {
    if (!actor.examCenterId) throw new Error("บัญชีเจ้าหน้าที่สนามสอบยังไม่ได้ผูกกับสนามสอบ");
    return { examCenterId: actor.examCenterId };
  }

  return requestedOrganizationId ? { organizationId: requestedOrganizationId } : {};
}
