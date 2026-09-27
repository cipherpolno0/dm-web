import Link from "next/link";

import type { PublicServiceCounts } from "@/lib/public-data";

type ServiceDirectoryProps = Readonly<{
  counts: PublicServiceCounts;
}>;

const services = [
  {
    href: "/services/statistics",
    title: "สถิติการสอบ",
    description: "ดูข้อมูลสรุปผลการสอบตามปีการศึกษา ประเภท และระดับชั้น",
  },
  {
    href: "/services/organizations",
    title: "ทำเนียบสำนักเรียน",
    description: "ค้นหารายชื่อสำนักเรียนและสถานศึกษาที่อยู่ในระบบ",
    countKey: "organizations" as const,
  },
  {
    href: "/services/exam-centers",
    title: "สนามสอบ",
    description: "ค้นหารายชื่อและข้อมูลติดต่อของสนามสอบ",
    countKey: "examCenters" as const,
  },
];

export function ServiceDirectory({ counts }: ServiceDirectoryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:gap-6">
      {services.map((service) => (
        <article
          className="flex flex-col rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-6"
          key={service.href}
        >
          <h2 className="text-xl leading-[1.5] font-semibold">{service.title}</h2>
          <p className="mt-3 text-[var(--color-text-muted)]">{service.description}</p>
          {service.countKey ? (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              มีข้อมูล {counts[service.countKey].toLocaleString("th-TH")} รายการ
            </p>
          ) : null}
          <Link
            className="mt-auto min-h-11 pt-4 text-sm font-semibold text-[var(--color-link)] hover:underline"
            href={service.href}
          >
            เปิดบริการ: {service.title}
          </Link>
        </article>
      ))}
    </div>
  );
}
