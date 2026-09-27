import Link from "next/link";

import { deleteAnnouncementAction } from "@/app/(admin)/content/actions";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";

const cmsRoles = ["super_admin", "field_officer"] as const;

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  await requireRole(cmsRoles);
  const announcements = await getPrisma().announcement.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl leading-[1.3] font-bold md:text-4xl">ข่าวและประกาศ</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            จัดทำฉบับร่าง เผยแพร่ทันที หรือกำหนดเวลาเผยแพร่ล่วงหน้า
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
          href="/content/new"
        >
          สร้างประกาศ
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[var(--color-surface-subtle)] text-sm">
            <tr>
              <th className="p-3">หัวข้อ</th>
              <th className="p-3">หมวดหมู่</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3">เผยแพร่</th>
              <th className="p-3">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((announcement) => (
              <tr className="border-t border-[var(--color-border)]" key={announcement.id}>
                <td className="p-3 font-medium">{announcement.title}</td>
                <td className="p-3">{announcement.category}</td>
                <td className="p-3">
                  {announcement.status === "PUBLISHED" ? "เผยแพร่" : "ฉบับร่าง"}
                </td>
                <td className="p-3">{announcement.publishedAt?.toLocaleString("th-TH") ?? "—"}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <Link
                      className="font-semibold text-[var(--color-link)] hover:underline"
                      href={`/content/${announcement.id}`}
                    >
                      แก้ไข
                    </Link>
                    <form action={deleteAnnouncementAction.bind(null, announcement.id)}>
                      <button
                        className="min-h-11 font-semibold text-[var(--color-error)] hover:underline"
                        type="submit"
                      >
                        ลบ
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {announcements.length === 0 ? (
              <tr>
                <td className="p-4 text-[var(--color-text-muted)]" colSpan={5}>
                  ยังไม่มีข่าวหรือประกาศ
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
