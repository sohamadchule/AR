import { env } from "@/lib/env";

import { base64UrlEncode, hmacSign, hmacVerify } from "./crypto";

/**
 * Minimal admin session for the MVP.
 *
 * A single shared password (ADMIN_PASSWORD) gates the admin app and all mutation
 * APIs. On successful login we set a signed, httpOnly cookie; the signature is an
 * HMAC over a small payload using ADMIN_SESSION_SECRET, so the cookie cannot be
 * forged without the secret. There is no user table — this is intentionally the
 * simplest thing that securely separates admin operations from public ones, and
 * can be replaced with real auth later without touching route logic.
 */

export const ADMIN_COOKIE = "ar_admin";

/** Session lifetime in seconds (7 days). */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Whether the provided password matches the configured admin password. */
export function isValidAdminPassword(password: string): boolean {
  const expected = env.adminPassword;
  if (password.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/** Create a signed session token: "<payload>.<hmac>". */
export async function createAdminSession(): Promise<string> {
  const payload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify({ iat: Date.now() })),
  );
  const signature = await hmacSign(env.adminSessionSecret, payload);
  return `${payload}.${signature}`;
}

/** Verify a session token's integrity. Returns true if it is authentic. */
export async function verifyAdminSession(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  try {
    return await hmacVerify(env.adminSessionSecret, payload, signature);
  } catch {
    return false;
  }
}
