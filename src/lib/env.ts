/**
 * Centralized, lazily-validated environment configuration.
 *
 * Values are read on access (via getters) rather than at import time, so that
 * building the app or running tooling never crashes just because a runtime-only
 * secret (e.g. DATABASE_URL) is absent. Anything that actually needs a value
 * calls the getter and gets a clear error if it is missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}

function parseNonNegativeInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export const env = {
  /** PostgreSQL connection string. Required for any database access. */
  get databaseUrl(): string {
    return requireEnv("DATABASE_URL");
  },

  /** Shared admin password gating /admin and all mutation APIs. */
  get adminPassword(): string {
    return requireEnv("ADMIN_PASSWORD");
  },

  /** Secret used to sign the admin session cookie. */
  get adminSessionSecret(): string {
    return requireEnv("ADMIN_SESSION_SECRET");
  },

  /** Storage driver: "local" (default) today; "s3" reserved for later. */
  get storageDriver(): string {
    return process.env.STORAGE_DRIVER?.trim() || "local";
  },

  /** Directory used by the local storage driver. Relative to project root. */
  get localStorageDir(): string {
    return process.env.LOCAL_STORAGE_DIR?.trim() || ".storage";
  },

  /**
   * Explicit public base URL (scheme + host, no trailing slash) used when
   * building the public /view URL for QR codes. When unset, callers fall back
   * to the incoming request's origin.
   */
  get publicBaseUrl(): string | null {
    const raw = process.env.PUBLIC_BASE_URL?.trim();
    if (!raw) return null;
    return raw.replace(/\/+$/, "");
  },

  /**
   * Maximum accepted GLB upload size in bytes. 0 means "no limit" (the MVP
   * default). Set this if a deployment target imposes a request-size cap.
   */
  get maxUploadBytes(): number {
    return parseNonNegativeInt(process.env.MAX_UPLOAD_BYTES, 0);
  },
} as const;
