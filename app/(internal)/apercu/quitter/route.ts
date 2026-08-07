import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const draft = await draftMode();
  draft.disable();
  const target = new URL(request.url).searchParams.get("redirect");
  redirect(target && target.startsWith("/admin/") ? target : "/admin/articles");
}
