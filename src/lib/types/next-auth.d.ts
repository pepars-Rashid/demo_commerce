import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "user" | "operationManager" | "superAdmin"
    } & DefaultSession["user"]
  }

  interface User {
    role: "user" | "operationManager" | "superAdmin"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "operationManager" | "superAdmin"
  }
}