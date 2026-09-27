import { ResultSearch } from "@/components/public/result-search";
import { PublicNav } from "@/components/ui/public-nav";
import { getPublishedResults, isDatabaseConfigured } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ค้นหาผลสอบ",
  description: "ค้นหาผลสอบนักธรรมและธรรมศึกษาที่ประกาศเผยแพร่แล้วด้วยเลขที่นั่งสอบหรือชื่อ–สกุล",
  alternates: { canonical: "/results" },
  robots: { index: false, follow: true },
};

export default async function ResultsPage() {
  const isConfigured = isDatabaseConfigured();
  const results = isConfigured ? await getPublishedResults() : [];

  return (
    <>
      <PublicNav />
      <main
        aria-label="ค้นหาผลสอบ"
        className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-12 lg:px-8"
        id="main-content"
        tabIndex={-1}
      >
        <h1 className="text-3xl leading-[1.3] font-bold md:text-4xl">ค้นหาผลสอบ</h1>
        <p className="mt-4 max-w-[720px] text-[var(--color-text-muted)]">
          ระบบแสดงเฉพาะชื่อ–นามสกุล ประเภท ระดับ ปีการศึกษา และสถานะผลสอบที่เผยแพร่แล้ว
          โดยไม่แสดงคะแนนดิบหรือข้อมูลส่วนบุคคลอื่น
        </p>
        {isConfigured ? (
          <div className="mt-8">
            <ResultSearch results={results} />
          </div>
        ) : (
          <section
            className="mt-8 rounded-md border border-[var(--color-info)] bg-[var(--color-info-bg)] p-4"
            aria-live="polite"
          >
            <h2 className="text-xl leading-[1.5] font-semibold">ยังไม่พร้อมให้ค้นหาผลสอบ</h2>
            <p className="mt-2">ผู้ดูแลระบบต้องกำหนดการเชื่อมต่อฐานข้อมูลก่อนเผยแพร่ผลสอบ</p>
          </section>
        )}
      </main>
    </>
  );
}
import type { Metadata } from "next";
