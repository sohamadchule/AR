import { env } from "@/lib/env";

import { LocalStorageAdapter } from "./local";
import type { StorageAdapter } from "./types";

let cached: StorageAdapter | null = null;

/**
 * Return the configured storage adapter (singleton).
 *
 * Selection is driven by STORAGE_DRIVER. Add new drivers here (e.g. an
 * S3-compatible adapter) without changing any caller.
 */
export function getStorage(): StorageAdapter {
  if (cached) return cached;

  const driver = env.storageDriver;
  switch (driver) {
    case "local":
      cached = new LocalStorageAdapter(env.localStorageDir);
      break;
    // case "s3":
    //   cached = new S3StorageAdapter({ ... });
    //   break;
    default:
      throw new Error(
        `Unknown STORAGE_DRIVER "${driver}". Supported: "local".`,
      );
  }

  return cached;
}

export type { StorageAdapter, ObjectStream, PutResult, StorageBody } from "./types";
