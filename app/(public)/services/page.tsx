import { ServiceDirectory } from "@/components/public/service-directory";
import { PublicNav } from "@/components/ui/public-nav";
import { getPublicServiceCounts, isDatabaseConfigured } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const isConfigured = isDatabaseConfigured();
  const counts = isConfigured ? await getPublicServiceCounts() : null;

  return (
    <>
      <PublicNav />
      <main
        aria-label="บริการข้อมูล"
        className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-12 lg:px-8"
        id="main-content"
        tabIndex={-1}
      >
        <h1 className="text-3xl leading-[1.3] font-bold md:text-4xl">บริการข้อมูล</h1>
        <p className="mt-4 max-w-[720px] text-[var(--color-text-muted)]">
          เลือกดูข้อมูลสาธารณะที่เกี่ยวข้องกับการสอบจากข้อมูลที่ส่วนกลางเผยแพร่
        </p>
        {counts ? (
          <div className="mt-8">
            <ServiceDirectory counts={counts} />
          </div>
        ) : (
          <section
            className="mt-8 rounded-md border border-[var(--color-info)] bg-[var(--color-info-bg)] p-4"
            aria-live="polite"
          >
            <h2 className="text-xl leading-[1.5] font-semibold">ยังไม่พร้อมแสดงบริการข้อมูล</h2>
            <p className="mt-2">
              ผู้ดูแลระบบต้องกำหนดการเชื่อมต่อฐานข้อมูลก่อนเผยแพร่ข้อมูลสาธารณะ
            </p>
          </section>
        )}
      </main>
    </>
  );
}
