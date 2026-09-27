import { requireRole } from "@/lib/authorization/server";

export default async function FieldOfficerPage() {
  await requireRole(["super_admin", "field_officer"]);

  return <main aria-label="หน้าสำหรับเจ้าหน้าที่สนามสอบ">เจ้าหน้าที่สนามสอบ</main>;
}
