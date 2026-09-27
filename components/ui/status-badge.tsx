import type { ReactNode } from "react";

type BadgeTone = "success" | "pending" | "error" | "info" | "muted";

type StatusBadgeProps = Readonly<{
  tone: BadgeTone;
  children: ReactNode;
}>;

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
  pending: "bg-[var(--color-pending-bg)] text-[var(--color-pending)]",
  error: "bg-[var(--color-error-bg)] text-[var(--color-error)]",
  info: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
  muted: "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]",
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-sm px-2 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
