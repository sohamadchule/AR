import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import type {
  ObjectStream,
  PutResult,
  StorageAdapter,
  StorageBody,
} from "./types";

/**
 * Local filesystem storage adapter.
 *
 * Streams uploads straight to disk (no full-file buffering in memory), so it
 * handles arbitrarily large GLB files. Intended for local development; the same
 * StorageAdapter interface is implemented by cloud adapters in production.
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = resolve(process.cwd(), baseDir);
  }

  /** Resolve an opaque key to an absolute path, refusing path traversal. */
  private resolveKey(key: string): string {
    const normalizedKey = key.replace(/\\/g, "/").replace(/^\/+/, "");
    const full = resolve(this.baseDir, normalizedKey);
    if (full !== this.baseDir && !full.startsWith(this.baseDir + sep)) {
      throw new Error(`Invalid storage key (path traversal): ${key}`);
    }
    return full;
  }

  async put(key: string, body: StorageBody): Promise<PutResult> {
    const path = this.resolveKey(key);
    await mkdir(dirname(path), { recursive: true });

    const readable =
      body instanceof Buffer || body instanceof Uint8Array
        ? Readable.from(Buffer.from(body))
        : Readable.fromWeb(body as unknown as Parameters<typeof Readable.fromWeb>[0]);

    await pipeline(readable, createWriteStream(path));
    const stats = await stat(path);
    return { size: stats.size };
  }

  async getStream(key: string): Promise<ObjectStream | null> {
    const path = this.resolveKey(key);
    let size: number;
    try {
      size = (await stat(path)).size;
    } catch {
      return null;
    }
    const nodeStream = createReadStream(path);
    const stream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;
    return { stream, size };
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}
