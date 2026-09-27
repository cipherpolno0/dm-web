import {
  commitScoreImportAction,
  previewScoreImportAction,
  publishResultsAction,
} from "@/app/(admin)/results-management/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";

type ResultsManagementPageProps = Readonly<{ searchParams: Promise<{ batch?: string }> }>;

const statusTone: Record<string, "success" | "pending" | "error" | "info"> = {
  READY: "success",
  COMMITTED: "info",
  REJECTED: "error",
  VALIDATING: "pending",
};

export const dynamic = "force-dynamic";

export default async function ResultsManagementPage({ searchParams }: ResultsManagementPageProps) {
  await requireRole(["super_admin"]);
  const prisma = getPrisma();
  const selectedBatchId = (await searchParams).batch;
  const [programs, batches, selectedBatch] = await Promise.all([
    prisma.examProgram.findMany({
      orderBy: [{ academicYear: { yearBe: "desc" } }, { code: "asc" }],
      include: {
        academicYear: { select: { yearBe: true } },
        examType: { select: { nameTh: true } },
        examLevel: { select: { nameTh: true } },
      },
    }),
    prisma.scoreImportBatch.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { examProgram: { select: { code: true } }, _count: { select: { issues: true } } },
    }),
    selectedBatchId
      ? prisma.scoreImportBatch.findFirst({
          where: { id: selectedBatchId, deletedAt: null },
          include: { issues: { orderBy: { rowNumber: "asc" }, take: 100 } },
        })
      : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 md:px-6 md:py-12">
      <header>
        <h1 className="text-3xl font-bold">นำเข้าคะแนนและประกาศผล</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          คะแนนที่บันทึกแล้วจะยังไม่แสดงสาธารณะ จนกว่าจะกดประกาศผลสำหรับหลักสูตรนั้น
        </p>
      </header>

      <form
        action={previewScoreImportAction}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <h2 className="text-xl font-semibold">ตรวจสอบไฟล์คะแนน Excel</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          หัวข้อแถวแรก: seatNo, score, outcome (หรือ เลขที่นั่งสอบ, คะแนน, ผลการสอบ)
          ระบบจะเก็บไฟล์ต้นฉบับไว้ในคลังส่วนตัวทุกครั้ง
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold" htmlFor="examProgramId">
              หลักสูตรสอบ
            </label>
            <select
              className="mt-1 min-h-11 w-full rounded-sm border border-[var(--color-border)] px-3"
              id="examProgramId"
              name="examProgramId"
              required
            >
              <option value="">เลือกหลักสูตร</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.academicYear.yearBe} — {program.examType.nameTh}{" "}
                  {program.examLevel.nameTh} ({program.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="score-file">
              ไฟล์ Excel
            </label>
            <input
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="mt-1 block min-h-11 w-full text-sm"
              id="score-file"
              name="file"
              required
              type="file"
            />
          </div>
        </div>
        <button
          className="mt-4 min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
          type="submit"
        >
          อัปโหลดและตรวจสอบ
        </button>
      </form>

      {selectedBatch ? (
        <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-xl font-semibold">ผลการตรวจสอบชุดนำเข้า</h2>
          <p className="mt-2">
            ไฟล์ {selectedBatch.sourceFileName}: ถูกต้อง {selectedBatch.validRows}/
            {selectedBatch.totalRows} แถว
          </p>
          {selectedBatch.issues.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--color-error)]">
              {selectedBatch.issues.map((issue) => (
                <li key={issue.id}>
                  แถว {issue.rowNumber}: {issue.message}
                </li>
              ))}
            </ul>
          ) : selectedBatch.status === "READY" ? (
            <form action={commitScoreImportAction.bind(null, selectedBatch.id)} className="mt-4">
              <button
                className="min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
                type="submit"
              >
                ยืนยันบันทึกคะแนนทั้งชุด
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-[var(--color-surface-subtle)]">
            <tr>
              <th className="p-3">หลักสูตร</th>
              <th className="p-3">ไฟล์</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3">ข้อผิดพลาด</th>
              <th className="p-3">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr className="border-t border-[var(--color-border)]" key={batch.id}>
                <td className="p-3">{batch.examProgram.code}</td>
                <td className="p-3">{batch.sourceFileName}</td>
                <td className="p-3">
                  <StatusBadge tone={statusTone[batch.status]}>{batch.status}</StatusBadge>
                </td>
                <td className="p-3">{batch._count.issues}</td>
                <td className="p-3">
                  {batch.status === "READY" ? (
                    <form action={commitScoreImportAction.bind(null, batch.id)}>
                      <button
                        className="font-semibold text-[var(--color-link)] hover:underline"
                        type="submit"
                      >
                        บันทึกคะแนน
                      </button>
                    </form>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-xl font-semibold">ประกาศผล</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          การประกาศจะสร้าง public projection ใหม่แบบ atomic และสลับผลที่ค้นหาได้ทันที
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {programs.map((program) => (
            <form action={publishResultsAction.bind(null, program.id)} key={program.id}>
              <button
                className="min-h-11 rounded-md border border-[var(--color-primary)] px-4 font-semibold text-[var(--color-primary)]"
                type="submit"
              >
                ประกาศ {program.code}
              </button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
