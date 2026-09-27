import {
  approveApplicationAction,
  importApplicationsAction,
  submitApplicationAction,
} from "@/app/(admin)/applications/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";

const statusLabel: Record<string, string> = {
  DRAFT: "ร่าง",
  SUBMITTED_TO_CENTER: "รอเจ้าหน้าที่สนามสอบอนุมัติ",
  CENTER_RETURNED: "ส่งกลับแก้ไข",
  CENTER_APPROVED: "อนุมัติแล้ว",
};

function Field({
  name,
  label,
  defaultValue,
}: Readonly<{ name: string; label: string; defaultValue?: string }>) {
  return (
    <div>
      <label className="block text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <input
        className="mt-1 min-h-11 w-full rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
        defaultValue={defaultValue}
        id={name}
        name={name}
        required
      />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const actor = await requireRole(["super_admin", "field_officer", "school"]);
  const prisma = getPrisma();
  const [organization, applications] = await Promise.all([
    actor.role === "school" && actor.organizationId
      ? prisma.organization.findFirst({ where: { id: actor.organizationId, deletedAt: null } })
      : Promise.resolve(null),
    prisma.examApplication.findMany({
      where: {
        deletedAt: null,
        ...(actor.role === "school" ? { organizationId: actor.organizationId ?? "" } : {}),
        ...(actor.role === "field_officer" ? { examCenterId: actor.examCenterId ?? "" } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        applicant: { select: { firstName: true, lastName: true } },
        organization: { select: { code: true, nameTh: true } },
        examCenter: { select: { code: true, nameTh: true } },
        examProgram: { select: { code: true } },
        seatAssignment: { select: { seatNo: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 md:px-6 md:py-12">
      <header>
        <h1 className="text-3xl font-bold">ใบสมัครสอบ</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          ใบสมัครที่ส่งแล้วจะถูกล็อกตามขั้นตอนอนุมัติ และไม่สามารถออกเลขที่นั่งสอบซ้ำได้
        </p>
      </header>

      {actor.role === "school" ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <form
            action={submitApplicationAction}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <h2 className="text-xl font-semibold">ยื่นใบสมัครรายบุคคล</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="เลขบัตรประชาชน" name="nationalId" />
              <Field label="รหัสสำนักเรียน" name="schoolCode" defaultValue={organization?.code} />
              <Field label="ชื่อ" name="firstName" />
              <Field label="นามสกุล" name="lastName" />
              <Field label="รหัสสนามสอบ" name="examCenterCode" />
              <Field label="รหัสหลักสูตรสอบ" name="examProgramCode" />
            </div>
            <button
              className="mt-4 min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
              type="submit"
            >
              ส่งใบสมัคร
            </button>
          </form>
          <form
            action={importApplicationsAction}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <h2 className="text-xl font-semibold">นำเข้าใบสมัครจาก Excel</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              ใช้ไฟล์ .xlsx โดยแถวแรกมีหัวข้อ: nationalId, firstName, lastName, schoolCode,
              examCenterCode, examProgramCode (หรือชื่อหัวข้อภาษาไทยตามความหมายเดียวกัน)
            </p>
            <label className="mt-4 block text-sm font-semibold" htmlFor="application-file">
              ไฟล์ Excel
            </label>
            <input
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="mt-1 block w-full text-sm"
              id="application-file"
              name="file"
              required
              type="file"
            />
            <button
              className="mt-4 min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
              type="submit"
            >
              ตรวจสอบและนำเข้า
            </button>
          </form>
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead className="bg-[var(--color-surface-subtle)]">
            <tr>
              <th className="p-3">ผู้สมัคร</th>
              <th className="p-3">สำนักเรียน</th>
              <th className="p-3">สนามสอบ</th>
              <th className="p-3">หลักสูตร</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3">เลขที่นั่ง</th>
              <th className="p-3">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr className="border-t border-[var(--color-border)]" key={application.id}>
                <td className="p-3">
                  {application.applicant.firstName} {application.applicant.lastName}
                </td>
                <td className="p-3">{application.organization.nameTh}</td>
                <td className="p-3">{application.examCenter.nameTh}</td>
                <td className="p-3">{application.examProgram.code}</td>
                <td className="p-3">
                  <StatusBadge
                    tone={application.status === "CENTER_APPROVED" ? "success" : "pending"}
                  >
                    {statusLabel[application.status]}
                  </StatusBadge>
                </td>
                <td className="p-3">{application.seatAssignment?.seatNo ?? "—"}</td>
                <td className="p-3">
                  {(actor.role === "field_officer" || actor.role === "super_admin") &&
                  application.status === "SUBMITTED_TO_CENTER" ? (
                    <form action={approveApplicationAction.bind(null, application.id)}>
                      <button
                        className="font-semibold text-[var(--color-link)] hover:underline"
                        type="submit"
                      >
                        อนุมัติและออกเลขที่นั่ง
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
    </main>
  );
}
