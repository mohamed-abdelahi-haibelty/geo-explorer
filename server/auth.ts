import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";
import { env } from "@/server/env";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // no public registration surface
    minPasswordLength: 12,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    useSecureCookies: true,
  },
  // Must stay last: applies Set-Cookie headers via next/headers when auth.api
  // methods are called from Server Actions/Components instead of the route handler.
  plugins: [nextCookies()],
});
