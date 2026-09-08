import { hasGlbMagic } from "@/lib/model";

/**
 * Streaming GLB upload validation.
 *
 * We never buffer the whole file in memory (models can be large). Instead we
 * wrap the incoming request body in a TransformStream that:
 *   - checks the GLB magic header ("glTF") on the first bytes, and
 *   - enforces an optional maximum size while bytes flow through.
 * On a violation the stream errors, which aborts the pipe to storage; the
 * caller then removes any partial object and returns the right status.
 */

export type UploadErrorKind = "invalid" | "too-large" | "empty";

export class UploadError extends Error {
  constructor(public readonly kind: UploadErrorKind) {
    super(kind);
    this.name = "UploadError";
  }
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out as Uint8Array;
}

/**
 * Return a validating stream derived from `source`. `maxBytes` of 0 means no
 * limit.
 */
export function glbValidatingStream(
  source: ReadableStream<Uint8Array>,
  maxBytes: number,
): ReadableStream<Uint8Array> {
  let magicChecked = false;
  let head: Uint8Array = new Uint8Array(0);
  let total = 0;

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      total += chunk.byteLength;
      if (maxBytes > 0 && total > maxBytes) {
        controller.error(new UploadError("too-large"));
        return;
      }

      if (magicChecked) {
        controller.enqueue(chunk);
        return;
      }

      head = concat(head, chunk);
      if (head.byteLength >= 4) {
        if (!hasGlbMagic(head.subarray(0, 4))) {
          controller.error(new UploadError("invalid"));
          return;
        }
        magicChecked = true;
        controller.enqueue(head);
        head = new Uint8Array(0);
      }
    },
    flush(controller) {
      if (!magicChecked) {
        // Fewer than 4 bytes ever arrived, or an empty body.
        controller.error(new UploadError(total === 0 ? "empty" : "invalid"));
      }
    },
  });

  return source.pipeThrough(transform);
}
