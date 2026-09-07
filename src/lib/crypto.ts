/**
 * Small HMAC helpers built on the Web Crypto API (globalThis.crypto.subtle).
 *
 * Web Crypto is available in both the Node.js runtime (route handlers) and the
 * Edge runtime (middleware), so the same signing/verification code works in
 * both places — unlike Node's `crypto` module, which is not available at the
 * edge.
 */

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/** Return a base64url HMAC-SHA256 signature of `data` using `secret`. */
export async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

/** Constant-time-ish comparison of two strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Verify that `signature` is a valid HMAC of `data` under `secret`. */
export async function hmacVerify(
  secret: string,
  data: string,
  signature: string,
): Promise<boolean> {
  const expected = await hmacSign(secret, data);
  return safeEqual(expected, signature);
}

export { base64UrlEncode };
