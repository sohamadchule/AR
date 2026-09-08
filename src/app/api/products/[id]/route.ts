import { jsonError, readJson, requireAdmin, validationError } from "@/lib/api";
import {
  deleteProduct,
  getProductById,
  toAdminProduct,
  updateProduct,
} from "@/lib/products";
import { getStorage } from "@/lib/storage";
import { productUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/products/:id — full product (admin). */
export async function GET(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) return jsonError("Product not found", 404);

  return Response.json({ product: toAdminProduct(product) });
}

/** PUT /api/products/:id — update name/description/isActive (admin). */
export async function PUT(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = productUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const product = await updateProduct(id, parsed.data);
  if (!product) return jsonError("Product not found", 404);

  return Response.json({ product: toAdminProduct(product) });
}

/** DELETE /api/products/:id — delete a product and its stored model (admin). */
export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  const existing = await getProductById(id);
  if (!existing) return jsonError("Product not found", 404);

  // Best-effort removal of the stored GLB; never block deletion on storage.
  if (existing.modelKey) {
    try {
      await getStorage().delete(existing.modelKey);
    } catch {
      // Ignore storage cleanup failures — the product record is authoritative.
    }
  }

  await deleteProduct(id);
  return Response.json({ ok: true });
}
