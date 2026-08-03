# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary — prospect decision-makers.** Public and private mining operators,
  investors, and public institutions in Mauritania evaluating or commissioning
  geoscience services (exploration, technical/economic studies, environmental
  compliance, GIS/remote sensing, training). They land on the home page or an
  article via search, browse a service line, and submit the contact form.
- **Secondary — technical readers.** Industry peers, researchers, students, and
  journalists reading the firm's published technical articles (studies by its
  own geologists) and company news/events.
- **Training audience.** Géologues, ingénieurs des mines, techniciens,
  prospecteurs, petits exploitants, cadres de sociétés minières, agents
  d'institutions publiques — the audience for the "Formation et renforcement de
  capacités" service line specifically.
- **Admin.** A single non-technical staff administrator who edits all site
  content (articles, news, services, page copy, partners, settings) through a
  back-office at `/admin`, with no developer involvement and no redeploy. No
  public signup; no role model — one account, full access.

## Product Purpose

GeoExplorer Services is a Mauritanian geoscience and mining consultancy
(Nouakchott, active since 2008) covering the full project cycle: géologie et
exploration minière, ingénierie minière et études, SIG et télédétection,
environnement, and formation. The website presents these five service lines,
publishes technical articles and company news, and routes prospect enquiries
to the client's inbox. A back-office lets non-technical staff edit every piece
of site content without a developer or a redeploy.

## Positioning

A full-cycle geoscience partner under one roof — geology, exploration, mining
engineering, GIS/remote sensing, environment, and training combined in a
single team — paired with field-level knowledge of Mauritanian geology,
mining, and logistics, and an established coordination network with
administrations, laboratories, consultants, and suppliers. The firm's own
framing: traceable data and conclusions that say what the results show, not
what is convenient to claim.

## Operating Context

- French-only site; Arabic/English localisation is explicitly out of scope
  (the schema carries no translations). The firm itself works trilingually
  (French, Arabic, English) even though the site is French-only.
- Admin back-office at `/admin`; single admin account; no public signup.
- Content types: Services (5 lines, each with ordered content blocks),
  Articles (technical studies with multiple authors, tags, optional PDF),
  News/actualités (events and company news with an image/video gallery),
  Partners, editable Page Sections for Home/About/Contact, Contact messages.
- Self-hosted by the client via `docker compose up`, TLS via Caddy.
- Cloudinary free tier for media; Resend free tier for transactional email —
  both impose practical limits (e.g. video delivery is capped, with an
  external URL fallback).
- Public pages are statically rendered and revalidate on write (ISR).

## Capabilities and Constraints

- Every visible string, image, and list on the public site must be editable
  from the back-office — no content hardcoded in components.
- Performance budget: LCP < 2.0s, CLS < 0.05, INP < 200ms on 4G. Lighthouse
  mobile targets: performance ≥ 90, SEO 100, accessibility ≥ 95.
- **Accessibility standard: WCAG 2.2 AA, formally required** (confirmed hard
  constraint — the site serves public institutions alongside private
  operators and investors).
- Full SEO surface required for articles/news: metadata, JSON-LD, sitemap,
  RSS — content must be indexable and competitive for Mauritanian
  mining/geoscience search queries.
- Single administrator account with full access — no roles or permission
  model to design around.
- Deployment is Docker on the client's own server, not a managed platform.

## Brand Commitments

- Name: **GeoExplorer Services**.
- Tagline: "Explorer le sol et le sous-sol. Révéler leurs richesses.
  Valoriser leur potentiel."
- Address: 37 Ext. F-NORD, Secteur 2, Tevragh Zeina, Nouakchott, Mauritanie.
  Phones: +222 22 00 20 04, +222 20 28 00 00. Email:
  contact@geoexplorerservices.com.
- Existing logo asset: `public/assets/logo.jpg`.
- **Brand colors (user-specified, binding): primary `#E35008`, secondary
  `#021798`.**
- Voice: rigorous, technical, understated — evidence and traceable data over
  persuasive or promotional language.

## Evidence on Hand

- `public/assets/logo.jpg` and three site photos
  (`IMG-20260731-WA0004.jpg`, `...WA0005.jpg`, `...WA0006.jpg`) are the only
  real photographic assets currently available. **No team photos, project
  photos, case studies, or testimonials exist yet — do not fabricate any.**
- **Partner names and logos exist and are confirmed to be provided by the
  user later.** Until delivered, the "Ils nous ont fait confiance" / partner
  section has no real names or marks to render — do not invent partner
  names, logos, or categories in the meantime.
- Full client-approved marketing copy for the Home, About, and Contact page
  sections, and for all five service lines (taglines, summaries, block
  titles and bullets), already exists verbatim in `prisma/seed.ts` /
  `context/tracker/content-source.md`. This is real, approved copy — not
  placeholder text — and should be treated as authoritative content, not
  rewritten without cause.

## Product Principles

1. **Rigor over persuasion.** The firm's own value proposition is traceable
   data and conclusions that say what the results show. Every surface should
   read as technically credible first, persuasive second.
2. **Content lives in the back-office, not the code.** Any new UI must render
   the CMS data model (Services, Articles, News, PageSection, Partners,
   SiteSetting) — never hardcode copy that already has a data home.
3. **Full-cycle breadth is the differentiator.** Five distinct service lines
   under one firm is the core positioning claim; design should make that
   breadth legible rather than flattening it into a generic services list.
4. **Field-tested locality, not generic global-consultancy tropes.**
   Mauritanian terrain, mining, and regulatory expertise since 2008 is a
   stated differentiator and should be visible in how the firm is presented.
5. **Performance and SEO are committed success criteria**, not aspirational
   goals — the LCP/CLS/INP budget and full indexability are part of the
   product's definition of done.

## Accessibility & Inclusion

WCAG 2.2 AA is a formal, confirmed requirement (the site serves public
institutions in addition to private operators and investors), in addition to
the Lighthouse accessibility ≥ 95 target already tracked as a build metric.
