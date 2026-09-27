import type { AppRole } from "@/lib/authorization/roles";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      organizationId: string | null;
      examCenterId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    organizationId: string | null;
    examCenterId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    organizationId?: string | null;
    examCenterId?: string | null;
  }
}
