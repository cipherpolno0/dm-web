import { notFound } from "next/navigation";

import { updateAnnouncementAction } from "@/app/(admin)/content/actions";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";

type EditAnnouncementPageProps = Readonly<{ params: Promise<{ id: string }> }>;

function localDateTime(value: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default async function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  await requireRole(["super_admin", "field_officer"]);
  const { id } = await params;
  const announcement = await getPrisma().announcement.findFirst({ where: { id, deletedAt: null } });

  if (!announcement) notFound();

  return (
    <main className="mx-auto max-w-[720px] px-4 py-8 md:px-6 md:py-12">
      <h1 className="text-3xl leading-[1.3] font-bold">แก้ไขประกาศ</h1>
      <div className="mt-8">
        <AnnouncementForm
          action={updateAnnouncementAction.bind(null, id)}
          initial={{
            title: announcement.title,
            category: announcement.category,
            bodyHtml: announcement.bodyHtml || announcement.bodyMarkdown,
            status: announcement.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
            publishedAt: localDateTime(announcement.publishedAt),
          }}
        />
      </div>
    </main>
  );
}
