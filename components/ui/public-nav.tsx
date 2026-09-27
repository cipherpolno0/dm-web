import Link from "next/link";

const links = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/results", label: "ค้นหาผลสอบ" },
  { href: "/services", label: "บริการข้อมูล" },
];

export function PublicNav() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <a
        className="sr-only absolute left-4 top-3 z-10 rounded-md bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-on-primary)] focus:not-sr-only"
        href="#main-content"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <nav
        aria-label="เมนูหลัก"
        className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-4 py-3 md:gap-4 md:px-6 lg:px-8"
      >
        <Link
          className="mr-auto min-h-11 rounded-md px-2 py-1 text-base font-semibold text-[var(--color-primary)]"
          href="/"
        >
          ระบบสอบนักธรรม–ธรรมศึกษา
        </Link>
        <ul className="flex flex-wrap gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                className="min-h-11 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-link)] hover:underline"
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
