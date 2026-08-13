import { z } from "zod";

// The Zod registry for PageSection.data, keyed "PAGE:key". One schema per
// key, shared by all three locales — a PageSection row is single-locale
// (the row's own `locale` column is the discriminator; `data` holds one
// locale's flat shape), unlike ServiceBlock.title/items which are
// locale-keyed JSON *inside* one row. localizedTextSchema doesn't apply
// here for that reason.
//
// Shapes below are read from the seeded rows in prisma/seed.ts, not from
// the original spec as first written — it named two shapes that diverge
// from what actually got built: CONTACT:hero has no `lead`
// (folded into `body`), ABOUT:intro has a `subheading` the spec didn't list.

const imageIdSchema = z.string().min(1).optional();

const labelledItemSchema = z.object({
  label: z.string().trim().min(1).max(60),
  description: z.string().trim().max(240).optional(),
});

// HOME:strengths / ABOUT:strengths items — seed has no `icon` yet, but §4
// names one; accept it as optional so the schema doesn't reject live data
// and the admin can fill it in later.
const titledItemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(400).optional(),
  icon: z.string().trim().max(50).optional(),
});

export const sectionSchemas = {
  "HOME:hero": z.object({
    title: z.string().trim().min(3).max(160),
    subtitle: z.string().trim().max(320).optional(),
    ctaLabel: z.string().trim().max(60).optional(),
    ctaHref: z.string().trim().max(200).optional(),
    imageId: imageIdSchema,
  }),
  "HOME:values": z.object({
    items: z.array(labelledItemSchema).min(1).max(8),
  }),
  "HOME:whoWeAre": z.object({
    heading: z.string().trim().min(1).max(160),
    lead: z.string().trim().max(240),
    body: z.string().trim().max(2000),
    linkLabel: z.string().trim().max(60),
    linkHref: z.string().trim().max(200),
    imageId: imageIdSchema,
  }),
  "HOME:expertiseTeaser": z.object({
    heading: z.string().trim().min(1).max(160),
    intro: z.string().trim().max(320),
  }),
  "HOME:strengths": z.object({
    heading: z.string().trim().min(1).max(160),
    items: z.array(titledItemSchema).min(1).max(8),
  }),
  "HOME:partnersTeaser": z.object({
    heading: z.string().trim().min(1).max(160),
    subheading: z.string().trim().max(320),
    note: z.string().trim().max(320),
  }),
  "HOME:closingBanner": z.object({
    quote: z.string().trim().min(1).max(400),
    imageId: imageIdSchema,
  }),
  "ABOUT:intro": z.object({
    heading: z.string().trim().min(1).max(240),
    subheading: z.string().trim().max(120),
    body: z.array(z.string().trim().min(1).max(2000)).min(1).max(4),
    imageId: imageIdSchema,
  }),
  "ABOUT:mission": z.object({
    heading: z.string().trim().min(1).max(160),
    body: z.string().trim().max(1000),
  }),
  "ABOUT:vision": z.object({
    heading: z.string().trim().min(1).max(160),
    body: z.string().trim().max(1000),
  }),
  "ABOUT:strengths": z.object({
    heading: z.string().trim().min(1).max(160),
    items: z.array(titledItemSchema).min(1).max(8),
  }),
  "ABOUT:team": z.object({
    heading: z.string().trim().min(1).max(160),
    body: z.string().trim().max(1500),
    imageId: imageIdSchema,
  }),
  "ABOUT:approach": z.object({
    heading: z.string().trim().min(1).max(240),
    intro: z.string().trim().max(320),
    steps: z
      .array(
        z.object({
          number: z.number().int().min(1).max(20),
          title: z.string().trim().min(1).max(60),
          description: z.string().trim().max(200),
        }),
      )
      .min(1)
      .max(10),
  }),
  "ABOUT:referenceDomains": z.object({
    heading: z.string().trim().min(1).max(160),
    subheading: z.string().trim().max(320),
    items: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(120),
          description: z.string().trim().max(300).optional(),
          imageId: imageIdSchema,
        }),
      )
      .min(1)
      .max(8),
    note: z.string().trim().max(320),
  }),
  "SERVICES:intro": z.object({
    heading: z.string().trim().min(1).max(240),
    body: z.string().trim().max(600),
    imageId: imageIdSchema,
  }),
  "CONTACT:hero": z.object({
    heading: z.string().trim().min(1).max(240),
    body: z.string().trim().max(600),
    values: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
    imageId: imageIdSchema,
  }),
  "CONTACT:formIntro": z.object({
    body: z.string().trim().max(600),
  }),
  "CONTACT:projectTypes": z.object({
    items: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  }),
  "GLOBAL:legal": z.object({
    heading: z.string().trim().min(1).max(240),
    intro: z.string().trim().max(600).optional(),
    sections: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(160),
          body: z.string().trim().min(1).max(4000),
        }),
      )
      .min(1)
      .max(12),
  }),
} satisfies Record<string, z.ZodTypeAny>;

export type SectionKey = keyof typeof sectionSchemas;
export type SectionData<K extends SectionKey> = z.infer<(typeof sectionSchemas)[K]>;

// One minimal-but-typed default per key — never `null`, so a caller can
// always render *something* instead of branching on absence. Co-located
// with the schemas so a new key can't be added without also declaring its
// fallback (the `satisfies` below fails at compile time otherwise).
export const sectionFallbacks: { [K in SectionKey]: SectionData<K> } = {
  "HOME:hero": { title: "" },
  "HOME:values": { items: [] },
  "HOME:whoWeAre": { heading: "", lead: "", body: "", linkLabel: "", linkHref: "" },
  "HOME:expertiseTeaser": { heading: "", intro: "" },
  "HOME:strengths": { heading: "", items: [] },
  "HOME:partnersTeaser": { heading: "", subheading: "", note: "" },
  "HOME:closingBanner": { quote: "" },
  "ABOUT:intro": { heading: "", subheading: "", body: [""] },
  "ABOUT:mission": { heading: "", body: "" },
  "ABOUT:vision": { heading: "", body: "" },
  "ABOUT:strengths": { heading: "", items: [] },
  "ABOUT:team": { heading: "", body: "" },
  "ABOUT:approach": { heading: "", intro: "", steps: [] },
  "ABOUT:referenceDomains": { heading: "", subheading: "", items: [], note: "" },
  "SERVICES:intro": { heading: "", body: "" },
  "CONTACT:hero": { heading: "", body: "", values: [] },
  "CONTACT:formIntro": { body: "" },
  "CONTACT:projectTypes": { items: [] },
  "GLOBAL:legal": { heading: "", sections: [] },
};

export function getSectionSchema(page: string, key: string): z.ZodTypeAny | undefined {
  return sectionSchemas[`${page}:${key}` as SectionKey];
}

// ABOUT:approach's steps[].number is a display sequence, not admin-editable
// input (the field renderer's array-of-objects doesn't expose it) — the
// admin only orders the steps and edits title/description, and the form
// recomputes `number` from position right before validating a save. The
// one field in the whole registry that needs this; everything else's data
// passes through unchanged.
export function normalizeSectionData(page: string, key: string, data: Record<string, unknown>): Record<string, unknown> {
  if (`${page}:${key}` === "ABOUT:approach" && Array.isArray(data.steps)) {
    return {
      ...data,
      steps: (data.steps as Record<string, unknown>[]).map((step, index) => ({ ...step, number: index + 1 })),
    };
  }
  return data;
}

export function isSectionKey(page: string, key: string): boolean {
  return `${page}:${key}` in sectionSchemas;
}

// ── Declarative field descriptors ──────────────────────────────────────
// The Zod schemas above stay the single source of *validation* truth; this
// registry describes how to *render* each key's fields. A parallel
// hand-written array rather than runtime Zod introspection — 18 shapes is
// too many to hand-write as 18 near-duplicate forms (see news-form.tsx's
// size for a single shape), but this codebase has no schema-to-form
// machinery to extend either, so a small typed descriptor per key is the
// middle path: declarative, but still one grep-able source per section.
export type FieldSpec =
  | { kind: "text"; key: string; label: string; max?: number }
  | { kind: "textarea"; key: string; label: string; max?: number }
  | { kind: "image"; key: string; label: string }
  | { kind: "array-of-strings"; key: string; label: string; itemLabel: string; max?: number }
  | { kind: "array-of-objects"; key: string; label: string; itemLabel: string; itemFields: FieldSpec[]; max?: number };

const valuesItemFields: FieldSpec[] = [
  { kind: "text", key: "label", label: "Libellé", max: 60 },
  { kind: "textarea", key: "description", label: "Description", max: 240 },
];

const titledItemFields: FieldSpec[] = [
  { kind: "text", key: "title", label: "Titre", max: 120 },
  { kind: "textarea", key: "description", label: "Description", max: 400 },
];

const referenceDomainItemFields: FieldSpec[] = [
  { kind: "text", key: "title", label: "Titre", max: 120 },
  { kind: "textarea", key: "description", label: "Description", max: 300 },
  { kind: "image", key: "imageId", label: "Image" },
];

const approachStepFields: FieldSpec[] = [
  { kind: "text", key: "title", label: "Titre" },
  { kind: "textarea", key: "description", label: "Description", max: 200 },
];

export const sectionFieldSpecs: { [K in SectionKey]: FieldSpec[] } = {
  "HOME:hero": [
    { kind: "text", key: "title", label: "Titre", max: 160 },
    { kind: "textarea", key: "subtitle", label: "Sous-titre", max: 320 },
    { kind: "text", key: "ctaLabel", label: "Libellé du bouton", max: 60 },
    { kind: "text", key: "ctaHref", label: "Lien du bouton", max: 200 },
    { kind: "image", key: "imageId", label: "Image" },
  ],
  "HOME:values": [
    { kind: "array-of-objects", key: "items", label: "Valeurs", itemLabel: "Valeur", itemFields: valuesItemFields, max: 8 },
  ],
  "HOME:whoWeAre": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "textarea", key: "lead", label: "Accroche", max: 240 },
    { kind: "textarea", key: "body", label: "Texte", max: 2000 },
    { kind: "text", key: "linkLabel", label: "Libellé du lien", max: 60 },
    { kind: "text", key: "linkHref", label: "Lien", max: 200 },
    { kind: "image", key: "imageId", label: "Image" },
  ],
  "HOME:expertiseTeaser": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "textarea", key: "intro", label: "Introduction", max: 320 },
  ],
  "HOME:strengths": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "array-of-objects", key: "items", label: "Atouts", itemLabel: "Atout", itemFields: titledItemFields, max: 8 },
  ],
  "HOME:partnersTeaser": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "textarea", key: "subheading", label: "Sous-titre", max: 320 },
    { kind: "textarea", key: "note", label: "Note", max: 320 },
  ],
  "HOME:closingBanner": [
    { kind: "textarea", key: "quote", label: "Citation", max: 400 },
    { kind: "image", key: "imageId", label: "Image" },
  ],
  "ABOUT:intro": [
    { kind: "text", key: "heading", label: "Titre", max: 240 },
    { kind: "text", key: "subheading", label: "Sous-titre", max: 120 },
    { kind: "array-of-strings", key: "body", label: "Paragraphes", itemLabel: "Paragraphe", max: 4 },
    { kind: "image", key: "imageId", label: "Image" },
  ],
  "ABOUT:mission": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "textarea", key: "body", label: "Texte", max: 1000 },
  ],
  "ABOUT:vision": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "textarea", key: "body", label: "Texte", max: 1000 },
  ],
  "ABOUT:strengths": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "array-of-objects", key: "items", label: "Atouts", itemLabel: "Atout", itemFields: titledItemFields, max: 8 },
  ],
  "ABOUT:team": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "textarea", key: "body", label: "Texte", max: 1500 },
    { kind: "image", key: "imageId", label: "Image" },
  ],
  "ABOUT:approach": [
    { kind: "text", key: "heading", label: "Titre", max: 240 },
    { kind: "textarea", key: "intro", label: "Introduction", max: 320 },
    { kind: "array-of-objects", key: "steps", label: "Étapes", itemLabel: "Étape", itemFields: approachStepFields, max: 10 },
  ],
  "ABOUT:referenceDomains": [
    { kind: "text", key: "heading", label: "Titre", max: 160 },
    { kind: "textarea", key: "subheading", label: "Sous-titre", max: 320 },
    { kind: "array-of-objects", key: "items", label: "Domaines", itemLabel: "Domaine", itemFields: referenceDomainItemFields, max: 8 },
    { kind: "textarea", key: "note", label: "Note", max: 320 },
  ],
  "SERVICES:intro": [
    { kind: "text", key: "heading", label: "Titre", max: 240 },
    { kind: "textarea", key: "body", label: "Texte", max: 600 },
    { kind: "image", key: "imageId", label: "Image" },
  ],
  "CONTACT:hero": [
    { kind: "text", key: "heading", label: "Titre", max: 240 },
    { kind: "textarea", key: "body", label: "Texte", max: 600 },
    { kind: "array-of-strings", key: "values", label: "Valeurs", itemLabel: "Valeur", max: 8 },
    { kind: "image", key: "imageId", label: "Image" },
  ],
  "CONTACT:formIntro": [{ kind: "textarea", key: "body", label: "Texte", max: 600 }],
  "CONTACT:projectTypes": [
    { kind: "array-of-strings", key: "items", label: "Types de projet", itemLabel: "Type", max: 20 },
  ],
  "GLOBAL:legal": [
    { kind: "text", key: "heading", label: "Titre", max: 240 },
    { kind: "textarea", key: "intro", label: "Introduction", max: 600 },
    {
      kind: "array-of-objects",
      key: "sections",
      label: "Rubriques",
      itemLabel: "Rubrique",
      max: 12,
      itemFields: [
        { kind: "text", key: "title", label: "Titre" },
        { kind: "textarea", key: "body", label: "Texte", max: 4000 },
      ],
    },
  ],
};
