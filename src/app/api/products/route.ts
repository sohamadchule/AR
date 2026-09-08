import { requireAdmin, readJson, validationError } from "@/lib/api";
import { createProduct, listProducts, toAdminProduct } from "@/lib/products";
import { productCreateSchema } from "@/lib/validation";

/** GET /api/products — list all products (admin). */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const products = await listProducts();
  return Response.json({ products: products.map(toAdminProduct) });
}

/** POST /api/products — create a product (admin). */
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = productCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const product = await createProduct(parsed.data);
  return Response.json({ product: toAdminProduct(product) }, { status: 201 });
}
