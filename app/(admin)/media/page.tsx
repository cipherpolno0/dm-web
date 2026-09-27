import { MediaCategory } from "@prisma/client";

import { deleteMediaAction, uploadMediaAction } from "@/app/(admin)/media/actions";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";

type MediaPageProps = Readonly<{ searchParams: Promise<{ q?: string; category?: string }> }>;

const cmsRoles = ["super_admin", "field_officer"] as const;

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: MediaPageProps) {
  await requireRole(cmsRoles);
  const query = await searchParams;
  const search = query.q?.trim() ?? "";
  const category = Object.values(MediaCategory).includes(query.category as MediaCategory)
    ? (query.category as MediaCategory)
    : undefined;
  const files = await getPrisma().mediaFile.findMany({
    where: {
      deletedAt: null,
      category,
      ...(search ? { originalName: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      originalName: true,
      category: true,
      mimeType: true,
      sizeBytes: true,
      scanStatus: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-12">
      <h1 className="text-3xl leading-[1.3] font-bold md:text-4xl">คลังไฟล์</h1>
      <form
        action={uploadMediaAction}
        className="mt-8 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-6"
      >
        <h2 className="text-xl font-semibold">อัปโหลด PDF หรือรูปภาพ</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          รองรับ PDF, JPEG, PNG และ WebP ไม่เกิน 20 MB; ระบบตรวจชนิดจากเนื้อไฟล์ก่อนอัปโหลด
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block font-semibold" htmlFor="file">
              ไฟล์
            </label>
            <input
              className="mt-2 block min-h-11 w-full"
              id="file"
              name="file"
              required
              type="file"
            />
          </div>
          <div>
            <label className="block font-semibold" htmlFor="category">
              หมวดหมู่
            </label>
            <select
              className="mt-2 min-h-11 w-full rounded-sm border border-[var(--color-border)] px-3"
              id="category"
              name="category"
            >
              <option value="FORM">แบบฟอร์ม</option>
              <option value="EXAM">ข้อสอบ</option>
              <option value="GUIDE">คู่มือ</option>
            </select>
          </div>
        </div>
        <button
          className="mt-4 min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
          type="submit"
        >
          อัปโหลดไฟล์
        </button>
      </form>
      <form className="mt-8 flex flex-wrap gap-3" method="get">
        <input
          className="min-h-11 flex-1 rounded-sm border border-[var(--color-border)] px-3"
          defaultValue={search}
          name="q"
          placeholder="ค้นหาชื่อไฟล์"
          type="search"
        />
        <select
          className="min-h-11 rounded-sm border border-[var(--color-border)] px-3"
          defaultValue={category ?? ""}
          name="category"
        >
          <option value="">ทุกหมวดหมู่</option>
          <option value="FORM">แบบฟอร์ม</option>
          <option value="EXAM">ข้อสอบ</option>
          <option value="GUIDE">คู่มือ</option>
        </select>
        <button
          className="min-h-11 rounded-md border border-[var(--color-border)] px-4 font-semibold"
          type="submit"
        >
          ค้นหา
        </button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[var(--color-surface-subtle)] text-sm">
            <tr>
              <th className="p-3">ชื่อไฟล์</th>
              <th className="p-3">หมวดหมู่</th>
              <th className="p-3">ชนิดจริง</th>
              <th className="p-3">ขนาด</th>
              <th className="p-3">ตรวจไฟล์</th>
              <th className="p-3">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr className="border-t border-[var(--color-border)]" key={file.id}>
                <td className="p-3 font-medium">{file.originalName}</td>
                <td className="p-3">{file.category}</td>
                <td className="p-3">{file.mimeType}</td>
                <td className="p-3">{(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</td>
                <td className="p-3">{file.scanStatus === "CLEAN" ? "ผ่าน" : "รอตรวจ"}</td>
                <td className="p-3">
                  <form action={deleteMediaAction.bind(null, file.id)}>
                    <button
                      className="min-h-11 font-semibold text-[var(--color-error)] hover:underline"
                      type="submit"
                    >
                      ลบ
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {files.length === 0 ? (
              <tr>
                <td className="p-4 text-[var(--color-text-muted)]" colSpan={6}>
                  ไม่พบไฟล์
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
