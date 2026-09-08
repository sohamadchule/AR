import { cookies } from "next/headers";

import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";

/**
 * Server-side admin check for route handlers and server components.
 * Reads the signed session cookie and verifies its integrity.
 */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return verifyAdminSession(token);
}
