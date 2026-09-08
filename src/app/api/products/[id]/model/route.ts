import { jsonError, requireAdmin } from "@/lib/api";
import { env } from "@/lib/env";
import {
  ACCEPTED_UPLOAD_CONTENT_TYPES,
  GLB_CONTENT_TYPE,
  isGlbFilename,
  modelStorageKey,
} from "@/lib/model";
import {
  getActiveProductById,
  getProductById,
  setProductModel,
  toAdminProduct,
} from "@/lib/products";
import { getStorage } from "@/lib/storage";
import { UploadError, glbValidatingStream } from "@/lib/upload";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/products/:id/model — stream the current GLB (public).
 *
 * This is the stable, public model URL used by the viewer. Only active products
 * with a stored model are served. The URL is cache-busted by the caller with a
 * ?v=<modelUpdatedAt> param, so long-lived immutable caching is safe.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getActiveProductById(id);
  if (!product || !product.modelKey) {
    return jsonError("Model not found", 404);
  }

  const object = await getStorage().getStream(product.modelKey);
  if (!object) {
    return jsonError("Model not found", 404);
  }

  return new Response(object.stream, {
    status: 200,
    headers: {
      "content-type": product.modelContentType || GLB_CONTENT_TYPE,
      "content-length": String(object.size),
      "cache-control": "public, max-age=31536000, immutable",
      "content-disposition": "inline",
    },
  });
}

/**
 * POST /api/products/:id/model — upload or replace the GLB (admin).
 *
 * The file is streamed straight to storage (no full-file buffering), validated
 * for GLB extension, content type, magic header, and size as it flows.
 */
export async function POST(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) return jsonError("Product not found", 404);

  // Filename (for display + extension check) comes from a header so the body can
  // remain the raw file stream.
  const filename = request.headers.get("x-filename")?.trim() || "model.glb";
  if (!isGlbFilename(filename)) {
    return jsonError("Only .glb files are supported", 400);
  }

  const contentType = (request.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!ACCEPTED_UPLOAD_CONTENT_TYPES.includes(contentType)) {
    return jsonError(
      `Unexpected content type "${contentType}". Expected a GLB file.`,
      415,
    );
  }

  // Early size rejection when the client declares a length.
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (
    env.maxUploadBytes > 0 &&
    Number.isFinite(declaredLength) &&
    declaredLength > env.maxUploadBytes
  ) {
    return jsonError("File exceeds the maximum allowed size", 413);
  }

  if (!request.body) {
    return jsonError("Empty upload", 400);
  }

  const key = modelStorageKey(id);
  const storage = getStorage();

  try {
    const validated = glbValidatingStream(request.body, env.maxUploadBytes);
    const { size } = await storage.put(key, validated);
    const updated = await setProductModel(id, {
      key,
      originalName: filename,
      contentType: GLB_CONTENT_TYPE,
      sizeBytes: size,
    });
    if (!updated) {
      // Product vanished mid-upload; clean up the orphaned object.
      await storage.delete(key).catch(() => {});
      return jsonError("Product not found", 404);
    }
    return Response.json({ product: toAdminProduct(updated) });
  } catch (error) {
    // Remove any partially written object on failure.
    await storage.delete(key).catch(() => {});

    if (error instanceof UploadError) {
      if (error.kind === "too-large") {
        return jsonError("File exceeds the maximum allowed size", 413);
      }
      if (error.kind === "empty") {
        return jsonError("Empty upload", 400);
      }
      return jsonError("The file is not a valid GLB model", 400);
    }
    throw error;
  }
}
