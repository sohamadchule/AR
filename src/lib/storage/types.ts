/**
 * Object-storage abstraction.
 *
 * The application never talks to a concrete storage backend directly. It works
 * through this interface so the backing store (local filesystem for dev,
 * S3-compatible object storage later) can be swapped without touching product
 * pages, upload flows, or the database.
 *
 * Keys are opaque, forward-slash-separated paths (e.g. "models/<id>.glb").
 * Adapters are responsible for rejecting keys that escape their namespace.
 */

export type StorageBody = ReadableStream<Uint8Array> | Buffer | Uint8Array;

export interface PutResult {
  /** Number of bytes actually written. */
  size: number;
}

export interface ObjectStream {
  /** A web ReadableStream of the object's bytes. */
  stream: ReadableStream<Uint8Array>;
  /** Total size in bytes. */
  size: number;
}

export interface StorageAdapter {
  /** Write (or overwrite) the object at `key`. */
  put(key: string, body: StorageBody): Promise<PutResult>;
  /** Stream the object at `key`, or null if it does not exist. */
  getStream(key: string): Promise<ObjectStream | null>;
  /** Delete the object at `key`. No-op if it does not exist. */
  delete(key: string): Promise<void>;
  /** Whether an object exists at `key`. */
  exists(key: string): Promise<boolean>;
}
