import { compare } from "bcryptjs"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

/**
 * Auth.js (NextAuth v5) for SPM ONE.
 *
 * **Credentials + JWT sessions:** Auth.js does not support database session rows
 * together with the Credentials provider; JWT in cookies is the supported pattern.
 * **No Prisma adapter (credentials-only v1):** `PrismaAdapter` is for OAuth / DB
 * sessions. With email/password + JWT, attaching the adapter can break sign-in
 * even when passwords in the DB are correct. Re-add `PrismaAdapter(prisma)` when
 * you add Google/GitHub etc. `Account` / `Session` / `VerificationToken` tables
 * stay in the schema for that future work.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email
        const passwordRaw = credentials?.password
        if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
          return null
        }
        const email = emailRaw.trim().toLowerCase()
        if (!email || !passwordRaw) return null

        const user = await prisma.user.findUnique({
          where: { email },
        })
        if (!user?.passwordHash) return null

        if (
          process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === "true" &&
          user.emailVerified === null
        ) {
          return null
        }

        const valid = await compare(passwordRaw, user.passwordHash)
        if (!valid) return null

        await prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => undefined)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
})
