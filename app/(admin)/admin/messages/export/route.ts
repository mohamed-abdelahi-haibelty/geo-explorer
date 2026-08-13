import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { listMessagesForExport } from "@/server/queries/messages";
import { contactStatusSchema } from "@/lib/validation/contact";
import type { ContactStatus } from "@/prisma/generated/client";

const COLUMNS = ["Date", "Statut", "Nom", "Société", "E-mail", "Téléphone", "Type de projet", "Langue", "E-mail envoyé", "Message"] as const;

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

// Session-gated like every other admin-only route handler (see
// app/api/cloudinary/sign/route.ts) — CSV export is a read of every
// visitor's contact details, not something to leave open on a guessable URL.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Connexion requise.", { status: 401 });
  }

  const statusParam = new URL(request.url).searchParams.get("status");
  const parsedStatus = contactStatusSchema.safeParse(statusParam);
  const status: ContactStatus | undefined = parsedStatus.success ? parsedStatus.data : undefined;

  const messages = await listMessagesForExport(status);

  const rows = messages.map((message) =>
    [
      message.createdAt.toISOString(),
      message.status,
      message.name,
      message.company ?? "",
      message.email,
      message.phone ?? "",
      message.projectType ?? "",
      message.locale,
      message.emailSent ? "oui" : "non",
      message.message,
    ]
      .map(csvCell)
      .join(","),
  );

  const csv = [COLUMNS.map(csvCell).join(","), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="messages${status ? `-${status.toLowerCase()}` : ""}.csv"`,
    },
  });
}
