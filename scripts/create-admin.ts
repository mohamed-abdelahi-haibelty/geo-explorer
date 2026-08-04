import "dotenv/config";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const inputSchema = z.object({
  email: z.email(),
  password: z.string().min(12),
});

function readArgs() {
  const [, , argEmail, argPassword] = process.argv;
  return {
    email: argEmail ?? process.env.ADMIN_EMAIL,
    password: argPassword ?? process.env.ADMIN_INITIAL_PASSWORD,
  };
}

async function main() {
  const parsed = inputSchema.safeParse(readArgs());
  if (!parsed.success) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
    console.error("Or set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD in the environment.");
    for (const issue of parsed.error.issues) {
      console.error(`- ${issue.path.join(".") || "email/password"}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const email = parsed.data.email.toLowerCase();

  // Go through Better Auth's own internal adapter and password hasher — not
  // the public sign-up endpoint, which `disableSignUp` rejects unconditionally
  // — so the stored hash is one Better Auth's own sign-in can verify.
  const ctx = await auth.$context;

  const existing = await ctx.internalAdapter.findUserByEmail(email);
  if (existing) {
    console.log(`An account already exists for ${email}; nothing to do.`);
    return;
  }

  const hash = await ctx.password.hash(parsed.data.password);
  const user = await ctx.internalAdapter.createUser({
    email,
    name: "Administrateur",
    emailVerified: false,
    mustChangePassword: true,
  });
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hash,
  });

  console.log(`Admin account created for ${email}. The password must be changed on first sign-in.`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
