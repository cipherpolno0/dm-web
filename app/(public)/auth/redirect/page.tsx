import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAppRole, roleHomePath } from "@/lib/authorization/roles";

export const dynamic = "force-dynamic";

export default async function AuthRedirectPage() {
  const session = await auth();
  const role = session?.user?.role;

  redirect(role && isAppRole(role) ? roleHomePath(role) : "/login");
}
