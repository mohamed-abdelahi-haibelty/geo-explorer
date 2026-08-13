// `<` is escaped so a title/description containing "</script>" can't break
// out of the tag — JSON.stringify alone doesn't guard against that.
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}
