import { AnnouncementStatus, ResultPublicationStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { getPrisma } from "@/lib/db/prisma";

export type PublicAnnouncement = Readonly<{
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string;
  publishedAt: Date;
}>;

export type PublicCalendarEvent = Readonly<{
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  examType: string | null;
  examLevel: string | null;
}>;

export type PublicResult = Readonly<{
  id: string;
  displayName: string;
  seatNo: string | null;
  examType: string;
  examLevel: string;
  academicYear: number;
  outcome: string;
  organizationName: string | null;
}>;

export type PublicServiceCounts = Readonly<{
  organizations: number;
  examCenters: number;
}>;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function getPublicHomeData() {
  const prisma = getPrisma();
  const now = new Date();

  const [announcements, calendarEvents] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        deletedAt: null,
        publishedAt: { lte: now },
        status: AnnouncementStatus.PUBLISHED,
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        category: true,
        publishedAt: true,
      },
    }),
    prisma.calendarEvent.findMany({
      where: {
        deletedAt: null,
        isPublic: true,
        publishedAt: { lte: now },
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        examProgram: {
          select: {
            examLevel: { select: { nameTh: true } },
            examType: { select: { nameTh: true } },
          },
        },
      },
    }),
  ]);

  return {
    announcements: announcements.filter(
      (announcement): announcement is PublicAnnouncement => announcement.publishedAt !== null,
    ),
    calendarEvents: calendarEvents.map((event): PublicCalendarEvent => ({
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      examType: event.examProgram?.examType.nameTh ?? null,
      examLevel: event.examProgram?.examLevel.nameTh ?? null,
    })),
  };
}

/**
 * Home data is public and changes infrequently. Keep a short cache so the
 * landing page remains fast during result-day traffic while scheduled events
 * still roll over promptly.
 */
export const getCachedPublicHomeData = unstable_cache(getPublicHomeData, ["public-home-data"], {
  revalidate: 60,
});

export async function getPublishedResults(): Promise<PublicResult[]> {
  const prisma = getPrisma();

  const results = await prisma.resultPublicProjection.findMany({
    where: {
      isActive: true,
      publication: {
        deletedAt: null,
        publishedAt: { not: null },
        status: ResultPublicationStatus.PUBLISHED,
        isPublished: true,
      },
    },
    orderBy: [{ academicYear: { yearBe: "desc" } }, { displayName: "asc" }],
    select: {
      id: true,
      displayName: true,
      seatNo: true,
      examTypeCode: true,
      examLevelCode: true,
      outcome: true,
      publicOrganizationName: true,
      academicYear: { select: { yearBe: true } },
    },
  });

  return results.map((result) => ({
    id: result.id,
    displayName: result.displayName,
    seatNo: result.seatNo,
    examType: result.examTypeCode,
    examLevel: result.examLevelCode,
    academicYear: result.academicYear.yearBe,
    outcome: result.outcome,
    organizationName: result.publicOrganizationName,
  }));
}

export async function getPublicServiceCounts(): Promise<PublicServiceCounts> {
  const prisma = getPrisma();

  const [organizations, examCenters] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.examCenter.count({ where: { deletedAt: null } }),
  ]);

  return { organizations, examCenters };
}
