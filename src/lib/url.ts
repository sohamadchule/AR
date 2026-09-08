import { env } from "@/lib/env";

/**
 * Resolve the public base URL (scheme + host, no trailing slash).
 *
 * Precedence:
 *   1. PUBLIC_BASE_URL if configured (authoritative in production).
 *   2. Forwarded host/proto headers (behind a proxy).
 *   3. The request's own origin (local dev).
 */
export function resolveBaseUrl(request: Request): string {
  if (env.publicBaseUrl) return env.publicBaseUrl;

  const headers = request.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host) {
    const proto = headers.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

/** The stable public product URL. This — and only this — is what a QR encodes. */
export function buildViewUrl(request: Request, productId: string): string {
  return `${resolveBaseUrl(request)}/view/${productId}`;
}

type HeaderGetter = { get(name: string): string | null };

/** Same resolution as resolveBaseUrl, for server components using next/headers. */
export function resolveBaseUrlFromHeaders(headers: HeaderGetter): string {
  if (env.publicBaseUrl) return env.publicBaseUrl;
  const host =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  const proto = headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** Build the public /view URL from request headers (server components). */
export function buildViewUrlFromHeaders(
  headers: HeaderGetter,
  productId: string,
): string {
  return `${resolveBaseUrlFromHeaders(headers)}/view/${productId}`;
}
