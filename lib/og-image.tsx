import type { LocaleCode } from "@/lib/validation/locale";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

// Satori (next/og's renderer) only supports ttf/otf/woff font files — every
// font this project ships is woff2 (next/font/google fetches TTFs it never
// exposes as raw bytes, and the self-hosted Arabic face in public/fonts/ is
// woff2-only too) — so this deliberately renders with Satori's built-in
// default, which only shapes Latin glyphs correctly. On `ar`, the headline
// is dropped rather than risk unshaped/boxed Arabic glyphs; the branded
// card (company name, which stays Latin even on ar — see the header logo)
// still renders. Revisit once a ttf/otf Arabic face is available.
export function buildArticleOgImage({ title, locale, companyName }: { title: string; locale: LocaleCode; companyName: string }) {
  const showHeadline = locale !== "ar";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        padding: 64,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 22, height: 22, background: "#E35008", borderRadius: 5 }} />
        <span style={{ fontSize: 26, fontWeight: 600, color: "#021798", letterSpacing: -0.5 }}>{companyName}</span>
      </div>

      {showHeadline ? (
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#0a0a0a",
            maxWidth: 980,
          }}
        >
          {title}
        </div>
      ) : (
        <div style={{ display: "flex", width: 140, height: 6, background: "#E35008" }} />
      )}

      <div style={{ display: "flex", width: "100%", height: 8, background: "#021798", borderRadius: 4 }} />
    </div>
  );
}
