import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    roleId: string;
    roleName: string;
  }

  interface Session {
    user: {
      id: string;
      roleId: string;
      roleName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleId: string;
    roleName: string;
  }
}
