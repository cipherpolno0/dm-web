import { ResultPublicationStatus } from "@prisma/client";

import type { AuthPrincipal } from "@/lib/authorization/require-role";
import { getPrisma } from "@/lib/db/prisma";
import { resolveReportScope } from "@/lib/reports/authorization";

export type DashboardRow = Readonly<{
  organization: string;
  level: string;
  applicants: number;
  passed: number;
}>;

export type DashboardData = Readonly<{
  totalApplicants: number;
  totalPassed: number;
  rows: DashboardRow[];
}>;

function isPassed(outcome: string | null | undefined) {
  return Boolean(outcome?.includes("ผ่าน"));
}

export async function getDashboardData(actor: AuthPrincipal): Promise<DashboardData> {
  const scope = resolveReportScope(actor);
  const applications = await getPrisma().examApplication.findMany({
    where: {
      deletedAt: null,
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
      ...(scope.examCenterId ? { examCenterId: scope.examCenterId } : {}),
    },
    select: {
      organization: { select: { nameTh: true } },
      examProgram: { select: { examLevel: { select: { nameTh: true } } } },
      scoreRecord: { select: { outcome: true } },
    },
  });
  const groups = new Map<
    string,
    { organization: string; level: string; applicants: number; passed: number }
  >();
  for (const application of applications) {
    const organization = application.organization.nameTh;
    const level = application.examProgram.examLevel.nameTh;
    const key = `${organization}\u0000${level}`;
    const current = groups.get(key) ?? { organization, level, applicants: 0, passed: 0 };
    current.applicants += 1;
    if (isPassed(application.scoreRecord?.outcome)) current.passed += 1;
    groups.set(key, current);
  }
  const rows = [...groups.values()].sort(
    (left, right) =>
      left.organization.localeCompare(right.organization, "th") ||
      left.level.localeCompare(right.level, "th"),
  );
  return {
    totalApplicants: applications.length,
    totalPassed: rows.reduce((total, row) => total + row.passed, 0),
    rows,
  };
}

export type PassedCandidateReportRow = Readonly<{
  displayName: string;
  seatNo: string | null;
  examType: string;
  examLevel: string;
  academicYear: number;
  outcome: string;
  organizationName: string | null;
}>;

export async function getPassedCandidateReport(
  actor: AuthPrincipal,
  requestedOrganizationId?: string | null,
): Promise<PassedCandidateReportRow[]> {
  const scope = resolveReportScope(actor, requestedOrganizationId);
  const rows = await getPrisma().resultPublicProjection.findMany({
    where: {
      isActive: true,
      outcome: { contains: "ผ่าน" },
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
      ...(scope.examCenterId ? { examCenterId: scope.examCenterId } : {}),
      publication: {
        status: ResultPublicationStatus.PUBLISHED,
        isPublished: true,
        deletedAt: null,
      },
    },
    orderBy: [
      { academicYear: { yearBe: "desc" } },
      { publicOrganizationName: "asc" },
      { displayName: "asc" },
    ],
    select: {
      displayName: true,
      seatNo: true,
      examTypeCode: true,
      examLevelCode: true,
      outcome: true,
      publicOrganizationName: true,
      academicYear: { select: { yearBe: true } },
    },
  });
  return rows.map((row) => ({
    displayName: row.displayName,
    seatNo: row.seatNo,
    examType: row.examTypeCode,
    examLevel: row.examLevelCode,
    academicYear: row.academicYear.yearBe,
    outcome: row.outcome,
    organizationName: row.publicOrganizationName,
  }));
}
