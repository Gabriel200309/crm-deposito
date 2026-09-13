import type { NextAuthConfig } from "next-auth";

/**
 * Configuração "leve" do Auth.js, sem o provider de credenciais (que depende do
 * Prisma Client). É usada pelo middleware, que roda no Edge Runtime e não
 * suporta módulos nativos do Node como os exigidos pelo Prisma.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.roleId = user.roleId;
        token.roleName = user.roleName;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.roleId = token.roleId as string;
        session.user.roleName = token.roleName as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
