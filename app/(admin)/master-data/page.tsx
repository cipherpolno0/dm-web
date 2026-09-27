import Link from "next/link";
import type { ReactNode } from "react";

import {
  deleteAcademicYearAction,
  deleteExamCenterAction,
  deleteExamLevelAction,
  deleteOrganizationAction,
  saveAcademicYearAction,
  saveExamCenterAction,
  saveExamLevelAction,
  saveOrganizationAction,
} from "@/app/(admin)/master-data/actions";
import { requireRole } from "@/lib/authorization/server";
import { getPrisma } from "@/lib/db/prisma";

type MasterDataPageProps = Readonly<{
  searchParams: Promise<{
    editOrganization?: string;
    editExamCenter?: string;
    editExamLevel?: string;
    editAcademicYear?: string;
  }>;
}>;

function Field({
  name,
  label,
  defaultValue,
  type = "text",
}: Readonly<{
  name: string;
  label: string;
  defaultValue?: string | number;
  type?: "text" | "number" | "email";
}>) {
  return (
    <div>
      <label className="block text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <input
        className="mt-1 min-h-11 w-full rounded-sm border border-[var(--color-border)] px-3"
        defaultValue={defaultValue}
        id={name}
        name={name}
        required
        type={type}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function MasterDataPage({ searchParams }: MasterDataPageProps) {
  const actor = await requireRole(["super_admin", "field_officer"]);
  const query = await searchParams;
  const prisma = getPrisma();
  const isSuperAdmin = actor.role === "super_admin";
  const [organizations, examCenters, examLevels, academicYears] = await Promise.all([
    isSuperAdmin
      ? prisma.organization.findMany({ where: { deletedAt: null }, orderBy: { nameTh: "asc" } })
      : Promise.resolve([]),
    prisma.examCenter.findMany({
      where: { deletedAt: null, ...(isSuperAdmin ? {} : { id: actor.examCenterId ?? "" }) },
      orderBy: { nameTh: "asc" },
    }),
    isSuperAdmin
      ? prisma.examLevel.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" } })
      : Promise.resolve([]),
    isSuperAdmin
      ? prisma.academicYear.findMany({ where: { deletedAt: null }, orderBy: { yearBe: "desc" } })
      : Promise.resolve([]),
  ]);
  const editOrganization = organizations.find((item) => item.id === query.editOrganization);
  const editExamCenter = examCenters.find((item) => item.id === query.editExamCenter);
  const editExamLevel = examLevels.find((item) => item.id === query.editExamLevel);
  const editAcademicYear = academicYears.find((item) => item.id === query.editAcademicYear);

  return (
    <main className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 md:px-6 md:py-12">
      <div>
        <h1 className="text-3xl leading-[1.3] font-bold md:text-4xl">ข้อมูลหลัก</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          การลบทั้งหมดเป็นการปิดใช้ข้อมูล และทุกการเปลี่ยนแปลงถูกบันทึก audit
        </p>
      </div>
      {isSuperAdmin ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <form
            action={saveOrganizationAction}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <h2 className="text-xl font-semibold">
              {editOrganization ? "แก้ไขสำนักเรียน" : "เพิ่มสำนักเรียน"}
            </h2>
            <input name="id" type="hidden" value={editOrganization?.id ?? ""} />
            <div className="mt-4 space-y-3">
              <Field defaultValue={editOrganization?.code} label="รหัส" name="code" />
              <Field defaultValue={editOrganization?.nameTh} label="ชื่อสำนักเรียน" name="nameTh" />
              <Field
                defaultValue={editOrganization?.notificationEmail ?? ""}
                label="อีเมลรับแจ้งผลสอบ"
                name="notificationEmail"
                type="email"
              />
              <button
                className="min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
                type="submit"
              >
                บันทึก
              </button>
            </div>
          </form>
          <DataTable
            headers={["รหัส", "ชื่อ", "อีเมลแจ้งผล", "การทำงาน"]}
            rows={organizations.map((item) => [
              item.code,
              item.nameTh,
              item.notificationEmail ?? "—",
              <div className="flex gap-3" key={item.id}>
                <Link
                  className="font-semibold text-[var(--color-link)] hover:underline"
                  href={`/master-data?editOrganization=${item.id}`}
                >
                  แก้ไข
                </Link>
                <form action={deleteOrganizationAction.bind(null, item.id)}>
                  <button
                    className="font-semibold text-[var(--color-error)] hover:underline"
                    type="submit"
                  >
                    ลบ
                  </button>
                </form>
              </div>,
            ])}
          />
        </section>
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <form
          action={saveExamCenterAction}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <h2 className="text-xl font-semibold">
            {editExamCenter ? "แก้ไขสนามสอบ" : "เพิ่มสนามสอบ"}
          </h2>
          <input name="id" type="hidden" value={editExamCenter?.id ?? ""} />
          <div className="mt-4 space-y-3">
            <Field defaultValue={editExamCenter?.code} label="รหัส" name="code" />
            <Field defaultValue={editExamCenter?.nameTh} label="ชื่อสนามสอบ" name="nameTh" />
            {isSuperAdmin || editExamCenter ? (
              <button
                className="min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
                type="submit"
              >
                บันทึก
              </button>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                เจ้าหน้าที่สนามสอบแก้ไขได้เฉพาะสนามสอบที่ผูกกับบัญชีของตน
              </p>
            )}
          </div>
        </form>
        <DataTable
          headers={["รหัส", "ชื่อ", "การทำงาน"]}
          rows={examCenters.map((item) => [
            item.code,
            item.nameTh,
            <div className="flex gap-3" key={item.id}>
              <Link
                className="font-semibold text-[var(--color-link)] hover:underline"
                href={`/master-data?editExamCenter=${item.id}`}
              >
                แก้ไข
              </Link>
              <form action={deleteExamCenterAction.bind(null, item.id)}>
                <button
                  className="font-semibold text-[var(--color-error)] hover:underline"
                  type="submit"
                >
                  ลบ
                </button>
              </form>
            </div>,
          ])}
        />
      </section>
      {isSuperAdmin ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <form
              action={saveExamLevelAction}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <h2 className="text-xl font-semibold">
                {editExamLevel ? "แก้ไขระดับชั้น" : "เพิ่มระดับชั้น"}
              </h2>
              <input name="id" type="hidden" value={editExamLevel?.id ?? ""} />
              <div className="mt-4 space-y-3">
                <Field defaultValue={editExamLevel?.code} label="รหัส" name="code" />
                <Field defaultValue={editExamLevel?.nameTh} label="ชื่อระดับชั้น" name="nameTh" />
                <button
                  className="min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
                  type="submit"
                >
                  บันทึก
                </button>
              </div>
            </form>
            <DataTable
              headers={["รหัส", "ชื่อ", "การทำงาน"]}
              rows={examLevels.map((item) => [
                item.code,
                item.nameTh,
                <div className="flex gap-3" key={item.id}>
                  <Link
                    className="font-semibold text-[var(--color-link)] hover:underline"
                    href={`/master-data?editExamLevel=${item.id}`}
                  >
                    แก้ไข
                  </Link>
                  <form action={deleteExamLevelAction.bind(null, item.id)}>
                    <button
                      className="font-semibold text-[var(--color-error)] hover:underline"
                      type="submit"
                    >
                      ลบ
                    </button>
                  </form>
                </div>,
              ])}
            />
          </section>
          <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <form
              action={saveAcademicYearAction}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <h2 className="text-xl font-semibold">
                {editAcademicYear ? "แก้ไขปีการศึกษา" : "เพิ่มปีการศึกษา"}
              </h2>
              <input name="id" type="hidden" value={editAcademicYear?.id ?? ""} />
              <div className="mt-4 space-y-3">
                <Field
                  defaultValue={editAcademicYear?.yearBe}
                  label="ปีการศึกษา (พ.ศ.)"
                  name="yearBe"
                  type="number"
                />
                <Field defaultValue={editAcademicYear?.label} label="ป้ายกำกับ" name="label" />
                <button
                  className="min-h-11 rounded-md bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]"
                  type="submit"
                >
                  บันทึก
                </button>
              </div>
            </form>
            <DataTable
              headers={["ปี", "ป้ายกำกับ", "การทำงาน"]}
              rows={academicYears.map((item) => [
                item.yearBe,
                item.label,
                <div className="flex gap-3" key={item.id}>
                  <Link
                    className="font-semibold text-[var(--color-link)] hover:underline"
                    href={`/master-data?editAcademicYear=${item.id}`}
                  >
                    แก้ไข
                  </Link>
                  <form action={deleteAcademicYearAction.bind(null, item.id)}>
                    <button
                      className="font-semibold text-[var(--color-error)] hover:underline"
                      type="submit"
                    >
                      ลบ
                    </button>
                  </form>
                </div>,
              ])}
            />
          </section>
        </>
      ) : null}
    </main>
  );
}

function DataTable({ headers, rows }: Readonly<{ headers: string[]; rows: ReactNode[][] }>) {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full border-collapse text-left">
        <thead className="bg-[var(--color-surface-subtle)] text-sm">
          <tr>
            {headers.map((header) => (
              <th className="p-3" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-t border-[var(--color-border)]" key={index}>
              {row.map((cell, cellIndex) => (
                <td className="p-3" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="p-4 text-[var(--color-text-muted)]" colSpan={headers.length}>
                ไม่มีข้อมูล
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
