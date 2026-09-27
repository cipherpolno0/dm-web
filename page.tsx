import { DashboardChart } from "@/components/admin/dashboard-chart";
import { requireRole } from "@/lib/authorization/server";
import { getDashboardData } from "@/lib/reports/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const actor = await requireRole(["super_admin", "field_officer", "school"]);
  const data = await getDashboardData(actor);

  return (
    <main className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 md:px-6 md:py-12">
      <header>
        <h1 className="text-3xl font-bold">ภาพรวมผลการสอบ</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          สถิติและรายงานจะแสดงเฉพาะข้อมูลในขอบเขตสิทธิ์ของบัญชีนี้
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-sm text-[var(--color-text-muted)]">จำนวนผู้สมัคร</p>
          <p className="mt-1 text-3xl font-bold">{data.totalApplicants.toLocaleString("th-TH")}</p>
        </article>
        <article className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-sm text-[var(--color-text-muted)]">จำนวนผู้สอบผ่าน</p>
          <p className="mt-1 text-3xl font-bold text-[var(--color-success)]">
            {data.totalPassed.toLocaleString("th-TH")}
          </p>
        </article>
      </section>
      <DashboardChart rows={data.rows} />
      <section className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead className="bg-[var(--color-surface-subtle)]">
            <tr>
              <th className="p-3">สำนักเรียน</th>
              <th className="p-3">ระดับชั้น</th>
              <th className="p-3">ผู้สมัคร</th>
              <th className="p-3">ผู้สอบผ่าน</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                className="border-t border-[var(--color-border)]"
                key={`${row.organization}-${row.level}`}
              >
                <td className="p-3">{row.organization}</td>
                <td className="p-3">{row.level}</td>
                <td className="p-3">{row.applicants.toLocaleString("th-TH")}</td>
                <td className="p-3">{row.passed.toLocaleString("th-TH")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-xl font-semibold">ส่งออกรายชื่อผู้สอบผ่าน</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          รายงานประกอบด้วยชื่อ–นามสกุล เลขที่นั่งสอบ ประเภท ระดับ ปีการศึกษา และสำนักเรียน
          เฉพาะผลที่ประกาศแล้ว
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            className="inline-flex min-h-11 items-center rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
            href="/api/reports/passed?format=xlsx"
          >
            ดาวน์โหลด Excel
          </a>
          <a
            className="inline-flex min-h-11 items-center rounded-md border border-[var(--color-primary)] px-4 font-semibold text-[var(--color-primary)]"
            href="/api/reports/passed?format=pdf"
          >
            ดาวน์โหลด PDF
          </a>
        </div>
      </section>
    </main>
  );
}
