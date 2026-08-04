import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;

export const passwordRules = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH} caractères minimum`,
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "Une lettre majuscule",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "Une lettre minuscule",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Un chiffre",
    test: (value: string) => /[0-9]/.test(value),
  },
  {
    id: "special",
    label: "Un caractère spécial (!?#$%…)",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `${PASSWORD_MIN_LENGTH} caractères minimum.`)
  .refine((value) => /[A-Z]/.test(value), "Le mot de passe doit contenir une lettre majuscule.")
  .refine((value) => /[a-z]/.test(value), "Le mot de passe doit contenir une lettre minuscule.")
  .refine((value) => /[0-9]/.test(value), "Le mot de passe doit contenir un chiffre.")
  .refine(
    (value) => /[^A-Za-z0-9]/.test(value),
    "Le mot de passe doit contenir un caractère spécial.",
  );
