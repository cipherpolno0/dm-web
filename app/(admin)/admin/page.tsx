import { requireRole } from "@/lib/authorization/server";

export default async function AdminHomePage() {
  await requireRole(["super_admin"]);

  return <main aria-label="หน้าผู้ดูแลระบบ">ผู้ดูแลระบบส่วนกลาง</main>;
}
