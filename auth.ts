import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticateWithPassword } from "@/lib/auth/credentials";
import { isAppRole } from "@/lib/authorization/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      name: "ชื่อผู้ใช้และรหัสผ่าน",
      credentials: {
        username: { label: "ชื่อผู้ใช้", type: "text" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      authorize: async (credentials, request) => {
        const username = typeof credentials?.username === "string" ? credentials.username : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        return authenticateWithPassword(username, password, request);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user && isAppRole(user.role)) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.examCenterId = user.examCenterId;
      }

      return token;
    },
    session({ session, token }) {
      if (!token.sub || !isAppRole(token.role)) {
        return session;
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          organizationId: typeof token.organizationId === "string" ? token.organizationId : null,
          examCenterId: typeof token.examCenterId === "string" ? token.examCenterId : null,
        },
      };
    },
  },
});
