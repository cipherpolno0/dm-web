import type { PublicCalendarEvent } from "@/lib/public-data";

type UpcomingCalendarProps = Readonly<{
  events: PublicCalendarEvent[];
}>;

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function UpcomingCalendar({ events }: UpcomingCalendarProps) {
  if (events.length === 0) {
    return (
      <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text-muted)] md:p-6">
        ยังไม่มีกำหนดการสอบที่เผยแพร่ในขณะนี้
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-6"
          key={event.id}
        >
          <time
            className="block text-sm font-semibold text-[var(--color-secondary)]"
            dateTime={event.startsAt.toISOString()}
          >
            {thaiDate.format(event.startsAt)}
          </time>
          <h3 className="mt-2 text-xl leading-[1.5] font-semibold">{event.title}</h3>
          {event.examType || event.examLevel ? (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {[event.examType, event.examLevel].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
