"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/(public)/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label className="block font-semibold" htmlFor="username">
          ชื่อผู้ใช้
        </label>
        <input
          autoComplete="username"
          className="mt-2 min-h-11 w-full rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)]"
          id="username"
          maxLength={100}
          name="username"
          required
        />
      </div>
      <div>
        <label className="block font-semibold" htmlFor="password">
          รหัสผ่าน
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 min-h-11 w-full rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)]"
          id="password"
          maxLength={128}
          name="password"
          required
          type="password"
        />
      </div>
      {state.error ? (
        <p
          className="rounded-sm bg-[var(--color-error-bg)] p-3 text-sm font-medium text-[var(--color-error)]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <button
        className="min-h-11 w-full rounded-md bg-[var(--color-primary)] px-4 text-base font-semibold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
