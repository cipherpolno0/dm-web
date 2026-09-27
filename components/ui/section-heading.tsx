import type { ReactNode } from "react";

type SectionHeadingProps = Readonly<{
  title: string;
  id?: string;
  children?: ReactNode;
}>;

export function SectionHeading({ title, id, children }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 className="text-2xl leading-[1.35] font-bold md:text-3xl" id={id}>
        {title}
      </h2>
      {children}
    </div>
  );
}
