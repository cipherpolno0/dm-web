import { createAnnouncementAction } from "@/app/(admin)/content/actions";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { requireRole } from "@/lib/authorization/server";

export default async function NewAnnouncementPage() {
  await requireRole(["super_admin", "field_officer"]);

  return (
    <main className="mx-auto max-w-[720px] px-4 py-8 md:px-6 md:py-12">
      <h1 className="text-3xl leading-[1.3] font-bold">สร้างประกาศ</h1>
      <div className="mt-8">
        <AnnouncementForm action={createAnnouncementAction} />
      </div>
    </main>
  );
}
