import { requireRole } from "@/lib/authorization/server";

export default async function SchoolPage() {
  await requireRole(["super_admin", "school"]);

  return <main aria-label="หน้าสำหรับสำนักเรียน">สำนักเรียน</main>;
}
