import "dotenv/config";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const inputSchema = z.object({
  email: z.email(),
});

function readArgs() {
  const [, , argEmail] = process.argv;
  return {
    email: argEmail ?? process.env.ADMIN_EMAIL,
  };
}

function generatePassword() {
  return randomBytes(18).toString("base64url");
}

async function main() {
  const parsed = inputSchema.safeParse(readArgs());
  if (!parsed.success) {
    console.error("Usage: npx tsx scripts/reset-admin-password.ts <email>");
    console.error("Or set ADMIN_EMAIL in the environment.");
    for (const issue of parsed.error.issues) {
      console.error(`- ${issue.path.join(".") || "email"}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const email = parsed.data.email.toLowerCase();

  // Same internal-adapter path as create-admin.ts, so the stored hash is one
  // Better Auth's own sign-in can verify.
  const ctx = await auth.$context;

  const user = await ctx.internalAdapter.findUserByEmail(email);
  if (!user) {
    console.error(`No account found for ${email}.`);
    process.exitCode = 1;
    return;
  }

  const newPassword = generatePassword();
  const hash = await ctx.password.hash(newPassword);

  await ctx.internalAdapter.updatePassword(user.user.id, hash);
  await ctx.internalAdapter.updateUser(user.user.id, { mustChangePassword: true });

  console.log(`Password reset for ${email}.`);
  console.log(`Temporary password: ${newPassword}`);
  console.log("mustChangePassword is set, so this must be changed on next sign-in.");
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
