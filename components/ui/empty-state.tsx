import type { ReactNode } from "react";

type EmptyStateProps = Readonly<{
  children?: ReactNode;
}>;

export function EmptyState({ children }: EmptyStateProps) {
  return <div>{children}</div>;
}
