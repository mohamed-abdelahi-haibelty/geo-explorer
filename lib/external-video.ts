// News.externalVideoUrl is already host-restricted to YouTube/Vimeo at write
// time (lib/validation/news.ts's ALLOWED_VIDEO_HOSTS) — this only extracts
// the id each host needs for a privacy-respecting embed and a thumbnail,
// never fetches anything itself, so a click-to-load gallery item stays a
// zero-byte anchor until the visitor actually asks for it.
export type ExternalVideo = { provider: "youtube" | "vimeo"; id: string; embedUrl: string; thumbnailUrl: string | null };

export function parseExternalVideoUrl(url: string): ExternalVideo | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    if (!id) return null;
    return { provider: "youtube", id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }

  if (host === "youtube.com") {
    const id = parsed.searchParams.get("v") ?? parsed.pathname.split("/").pop();
    if (!id) return null;
    return { provider: "youtube", id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }

  if (host === "vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean).pop();
    if (!id) return null;
    // Vimeo's oEmbed thumbnail needs a request Cloudinary-less pages here
    // don't make server-side (no fetch at render time) — the poster stays a
    // spectral fallback for Vimeo embeds, YouTube's thumbnail CDN is the one
    // exception because it's a stable, unauthenticated static URL.
    return { provider: "vimeo", id, embedUrl: `https://player.vimeo.com/video/${id}`, thumbnailUrl: null };
  }

  return null;
}
