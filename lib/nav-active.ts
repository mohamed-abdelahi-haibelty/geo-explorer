// Shared by the admin sidebar and the public header: both highlight the entry
// matching the page actually on screen, and both have exactly one "root" href
// (/admin, /<locale>) that every other href is a prefix-child of — so that one
// has to match exactly or it would stay lit on every page of the section.
export function isNavActive(pathname: string | null | undefined, href: string, exact = false): boolean {
  if (!pathname) return false;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
