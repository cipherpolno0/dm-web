import Link from "next/link";
import type { Metadata } from "next";

import { AnnouncementCard } from "@/components/public/announcement-card";
import { UpcomingCalendar } from "@/components/public/upcoming-calendar";
import { JsonLd } from "@/components/seo/json-ld";
import { PublicNav } from "@/components/ui/public-nav";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCachedPublicHomeData, isDatabaseConfigured } from "@/lib/public-data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ข่าวและกำหนดการสอบ",
  description: "ข่าวประชาสัมพันธ์ กำหนดการสอบ และช่องทางค้นหาผลสอบนักธรรม–ธรรมศึกษา",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ระบบสอบนักธรรม–ธรรมศึกษา",
    description: "ข่าวประชาสัมพันธ์ กำหนดการสอบ และผลสอบที่เผยแพร่จากส่วนกลาง",
    locale: "th_TH",
    type: "website",
  },
};

function homeJsonLd(
  announcements: Awaited<ReturnType<typeof getCachedPublicHomeData>>["announcements"],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ข่าวประชาสัมพันธ์ระบบสอบนักธรรม–ธรรมศึกษา",
    itemListElement: announcements.map((announcement, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "NewsArticle",
        headline: announcement.title,
        datePublished: announcement.publishedAt.toISOString(),
        articleSection: announcement.category,
        description: announcement.summary ?? undefined,
        inLanguage: "th",
      },
    })),
  };
}

export default async function PublicHomePage() {
  const isConfigured = isDatabaseConfigured();
  const data = isConfigured ? await getCachedPublicHomeData() : null;

  return (
    <>
      <PublicNav />
      {data?.announcements.length ? <JsonLd data={homeJsonLd(data.announcements)} /> : null}
      <main
        aria-label="หน้าหลัก"
        className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-12 lg:px-8"
        id="main-content"
        tabIndex={-1}
      >
        <section
          className="rounded-lg bg-[var(--color-surface-subtle)] p-6 md:p-8"
          aria-labelledby="home-title"
        >
          <p className="text-sm font-semibold text-[var(--color-secondary)]">ข้อมูลการสอบ</p>
          <h1 className="mt-2 text-3xl leading-[1.3] font-bold md:text-4xl" id="home-title">
            ระบบสอบนักธรรม–ธรรมศึกษา
          </h1>
          <p className="mt-4 max-w-[720px] text-lg text-[var(--color-text-muted)]">
            ตรวจสอบประกาศ กำหนดการสอบ และผลสอบที่เผยแพร่จากส่วนกลาง
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-md bg-[var(--color-primary)] px-4 text-base font-semibold text-[var(--color-on-primary)]"
            href="/results"
          >
            ค้นหาผลสอบ
          </Link>
        </section>

        {!isConfigured ? (
          <section
            className="mt-8 rounded-md border border-[var(--color-info)] bg-[var(--color-info-bg)] p-4"
            aria-live="polite"
          >
            <h2 className="text-xl leading-[1.5] font-semibold">ยังไม่พร้อมแสดงข้อมูลสาธารณะ</h2>
            <p className="mt-2">
              ผู้ดูแลระบบต้องกำหนดการเชื่อมต่อฐานข้อมูลก่อนเผยแพร่ข่าวและกำหนดการสอบ
            </p>
          </section>
        ) : (
          <>
            <section className="mt-12" aria-labelledby="announcement-heading">
              <SectionHeading id="announcement-heading" title="ข่าวประชาสัมพันธ์ล่าสุด" />
              {data?.announcements.length ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                  {data.announcements.map((announcement) => (
                    <AnnouncementCard announcement={announcement} key={announcement.id} />
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text-muted)]">
                  ยังไม่มีข่าวประชาสัมพันธ์ที่เผยแพร่
                </p>
              )}
            </section>
            <section className="mt-12" aria-labelledby="calendar-heading">
              <SectionHeading id="calendar-heading" title="ปฏิทินสอบที่กำลังจะถึง" />
              <div className="mt-6">
                <UpcomingCalendar events={data?.calendarEvents ?? []} />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
