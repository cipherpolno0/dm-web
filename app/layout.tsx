import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ระบบสอบนักธรรม–ธรรมศึกษา",
    template: "%s | ระบบสอบนักธรรม–ธรรมศึกษา",
  },
  description: "ระบบข่าว กำหนดการ และผลสอบนักธรรม–ธรรมศึกษา",
  applicationName: "ระบบสอบนักธรรม–ธรรมศึกษา",
  keywords: ["นักธรรม", "ธรรมศึกษา", "ผลสอบ", "กำหนดการสอบ", "ประกาศสอบ"],
  robots: { index: true, follow: true },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
