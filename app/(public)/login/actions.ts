"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginState = Readonly<{
  error?: string;
}>;

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/auth/redirect",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับชั่วคราว" };
    }

    throw error;
  }

  return {};
}
