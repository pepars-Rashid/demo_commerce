import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { eq } from "drizzle-orm"
import { db } from "@/db/db"
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema"
import { loginSchema } from "@/lib/zod/login"
import { verifyPassword } from "@/lib/auth/password"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const parsed = await loginSchema.safeParseAsync(credentials)
          if (!parsed.success) return null

          const { email, password } = parsed.data

          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          })

          if (!user?.password) return null

          const valid = await verifyPassword(password, user.password)
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        } catch {
          return null
        }
      },
    }),
  ],
})
