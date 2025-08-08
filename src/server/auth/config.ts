import { db } from "@/server/db";
import { getUserById } from "@/utils/getUser";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from "next-auth/jwt";
export const runtime = "nodejs";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      role: UserRole;
      emailVerified?: Date | null;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    role?: "ADMIN" | "USER";
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Partial<Record<"email" | "password", unknown>>,
      ) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (
          typeof user?.password === "string" &&
          typeof credentials.password === "string" &&
          bcrypt.compareSync(credentials.password, user.password)
        ) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        }
        return null;
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    // async authorized({ auth, request }) {
    //   console.log(auth?.user.role);
    //   const isLoggedIn = Boolean(auth?.user);
    //   if (isLoggedIn && auth?.user.role === "ADMIN") {
    //     return NextResponse.redirect(new URL("/admin", request.nextUrl));
    //   }

    //   return true;
    // },

    async session({ session, token }) {
      if (!session.user) return session;

      if (token.sub) {
        session.user.id = token.sub;
      }

      if (token.role) {
        session.user.role = token.role;
      } else {
        // Fallback: try to get role from database if not in token
        try {
          if (token.sub) {
            const user = await getUserById(token.sub);
            if (user) {
              session.user.role = user.role;
              session.user.emailVerified = user.emailVerified;
            }
          }
        } catch (error) {
          console.error("Error fetching user in session callback:", error);
        }
      }

      if (token.emailVerified) {
        if (typeof token.emailVerified === "string") {
          session.user.emailVerified = new Date(token.emailVerified);
        } else if (token.emailVerified instanceof Date) {
          session.user.emailVerified = token.emailVerified;
        } else {
          session.user.emailVerified = null;
        }
      }

      return session;
    },

    async jwt({ token, user, trigger }) {
      // If user is provided (during sign in), set the role and emailVerified
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        return token;
      }

      // For subsequent requests, try to get user data from database
      if (token.sub) {
        try {
          const existingUser = await getUserById(token.sub);
          if (existingUser) {
            token.role = existingUser.role;
            token.emailVerified = existingUser.emailVerified;
          } else {
            console.warn("User not found in database for token.sub:", token.sub);
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
          // Don't fail the request, just continue with existing token
        }
      }

      return token;
    },

    async signIn({
      user,
      account,
      profile: _profile,
      email: _email,
      credentials: _credentials,
    }) {
      // Only apply logic for OAuth (e.g., Google)
      if (account?.provider && account.provider !== "credentials") {
        const emailToCheck = user?.email;
        if (!emailToCheck) return false;
        // Remove emailVerified checks, allow sign in regardless
        const existingUser = await db.user.findUnique({
          where: { email: emailToCheck },
        });
        if (existingUser) {
          // Update the user ID in the session to match the database
          user.id = existingUser.id;
          return true;
        } else {
          // No user exists, create and mark as verified
          const newUser = await db.user.create({
            data: {
              email: emailToCheck,
              name: user?.name,
              image: user?.image,
              emailVerified: new Date(),
            },
          });
          // Update the user ID in the session to match the newly created user
          user.id = newUser.id;
          return true;
        }
      }
      // Default allow for credentials
      return true;
    },
  },
} satisfies NextAuthConfig;
