import Link from "next/link";

import type { PublicAnnouncement } from "@/lib/public-data";
import { StatusBadge } from "@/components/ui/status-badge";

type AnnouncementCardProps = Readonly<{
  announcement: PublicAnnouncement;
}>;

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <article className="flex h-full flex-col rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <StatusBadge tone="info">{announcement.category}</StatusBadge>
        <time dateTime={announcement.publishedAt.toISOString()}>
          {thaiDate.format(announcement.publishedAt)}
        </time>
      </div>
      <h3 className="mt-3 text-xl leading-[1.5] font-semibold">
        <Link
          className="text-[var(--color-link)] hover:underline"
          href={`/announcements/${announcement.slug}`}
        >
          {announcement.title}
        </Link>
      </h3>
      {announcement.summary ? (
        <p className="mt-3 text-[var(--color-text-muted)]">{announcement.summary}</p>
      ) : null}
      <Link
        className="mt-auto min-h-11 pt-3 text-sm font-semibold text-[var(--color-link)] hover:underline"
        href={`/announcements/${announcement.slug}`}
      >
        อ่านรายละเอียด: {announcement.title}
      </Link>
    </article>
  );
}
