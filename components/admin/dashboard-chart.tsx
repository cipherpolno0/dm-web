import type { DashboardRow } from "@/lib/reports/data";

export function DashboardChart({ rows }: Readonly<{ rows: readonly DashboardRow[] }>) {
  const maxApplicants = Math.max(1, ...rows.map((row) => row.applicants));

  return (
    <section
      aria-labelledby="dashboard-chart-title"
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h2 className="text-xl font-semibold" id="dashboard-chart-title">
        ภาพรวมผู้สมัครและผู้สอบผ่าน
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-[var(--color-text-muted)]">
          ยังไม่มีข้อมูลในขอบเขตที่คุณมีสิทธิ์ดู
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {rows.map((row) => (
            <li key={`${row.organization}-${row.level}`}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-semibold">
                  {row.organization} · {row.level}
                </span>
                <span className="text-[var(--color-text-muted)]">
                  ผู้สมัคร {row.applicants} / ผ่าน {row.passed}
                </span>
              </div>
              <div
                className="mt-2 h-4 overflow-hidden rounded-sm bg-[var(--color-surface-subtle)]"
                role="img"
                aria-label={`${row.organization} ${row.level}: ผู้สมัคร ${row.applicants} คน ผู้สอบผ่าน ${row.passed} คน`}
              >
                <div
                  className="h-full bg-[var(--color-primary)]"
                  style={{ width: `${(row.applicants / maxApplicants) * 100}%` }}
                />
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-sm bg-[var(--color-surface-subtle)]">
                <div
                  className="h-full bg-[var(--color-success)]"
                  style={{ width: `${(row.passed / maxApplicants) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
