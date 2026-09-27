import Link from "next/link";

import { LoginForm } from "@/app/(public)/login/login-form";
import { PublicNav } from "@/components/ui/public-nav";

export default function LoginPage() {
  return (
    <>
      <PublicNav />
      <main
        aria-labelledby="login-title"
        className="mx-auto max-w-[720px] px-4 py-8 md:px-6 md:py-12"
      >
        <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-6">
          <h1 className="text-3xl leading-[1.3] font-bold md:text-4xl" id="login-title">
            เข้าสู่ระบบเจ้าหน้าที่
          </h1>
          <p className="mt-4 text-[var(--color-text-muted)]">
            สำหรับผู้ดูแลส่วนกลาง เจ้าหน้าที่สนามสอบ และสำนักเรียน
          </p>
          <LoginForm />
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            ผู้เยี่ยมชมสามารถดูข้อมูลสาธารณะได้โดยไม่ต้องเข้าสู่ระบบ{" "}
            <Link className="font-semibold text-[var(--color-link)] hover:underline" href="/">
              กลับหน้าหลัก
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
