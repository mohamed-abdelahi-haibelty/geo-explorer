export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UPLOAD_REJECTED"
  | "EXTERNAL_SERVICE"
  | "INTERNAL";

export class AppError extends Error {
  code: ErrorCode;
  fields?: Record<string, string>;

  constructor(code: ErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}

// Shared by every action with more than one form field — keeps the first
// message per field so the form can render it inline (error-handling.md).
export function zodFieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string; fields?: Record<string, string> };

function mapUnknownError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error && typeof error === "object" && "code" in error) {
    switch ((error as { code?: string }).code) {
      case "P2002":
        return new AppError("CONFLICT", "Cette valeur est déjà utilisée.");
      case "P2025":
        return new AppError("NOT_FOUND", "Élément introuvable.");
      case "P2003":
        return new AppError("CONFLICT", "Cet élément est toujours référencé.");
      case "P2000":
        return new AppError("VALIDATION", "Valeur trop longue.");
    }
  }

  return new AppError("INTERNAL", "Une erreur inattendue est survenue.");
}

// Runs a Server Action body and maps its failure to the client-safe
// discriminated result. Never lets a raw Prisma/provider error cross the wire.
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    const mapped = mapUnknownError(error);
    if (mapped.code === "INTERNAL") {
      console.error(JSON.stringify({ level: "error", event: "action_failed", code: mapped.code }), error);
    }
    return { ok: false, code: mapped.code, message: mapped.message, fields: mapped.fields };
  }
}
