import { FileText } from "lucide-react";

// A link, not a download — no `download` attribute, so the browser's own
// PDF viewer opens it in the new tab instead of saving it (Cloudinary serves
// PDFs with an inline Content-Disposition by default, so nothing here forces
// a download either). This is a UX nudge toward reading in place, not access
// control — it's still a plain public URL, so a reader who wants the file
// on disk can always save it from that tab.
export function ArticlePdfLink({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <FileText aria-hidden="true" className="size-4 text-muted-foreground" />
      {label}
    </a>
  );
}
