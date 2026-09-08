import type { ZodError } from "zod";

import { isAdmin } from "@/lib/auth-server";

/** JSON error response helper. */
export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** 400 response listing zod validation issues. */
export function validationError(error: ZodError): Response {
  const issues = error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return Response.json({ error: "Validation failed", issues }, { status: 400 });
}

/**
 * Guard for admin-only handlers. Returns a 401 Response when the caller is not
 * an authenticated admin, or null when they are (so the handler proceeds).
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return jsonError("Unauthorized", 401);
}

/** Parse a JSON request body, returning null on malformed input. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
