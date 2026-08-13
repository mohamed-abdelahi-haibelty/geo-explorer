import { Mail, MessageCircle, Share2 } from "lucide-react";

// Plain anchors to each network's own share-intent URL — no JS, no tracking
// pixel, works with JS disabled.
export function ShareLinks({
  url,
  title,
  labels,
}: {
  url: string;
  title: string;
  labels: { linkedin: string; whatsapp: string; email: string };
}) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { key: "linkedin", label: labels.linkedin, icon: Share2, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { key: "whatsapp", label: labels.whatsapp, icon: MessageCircle, href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { key: "email", label: labels.email, icon: Mail, href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];

  return (
    <ul className="flex flex-wrap gap-2">
      {links.map(({ key, label, icon: Icon, href }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-secondary hover:text-secondary"
          >
            <Icon aria-hidden="true" className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
