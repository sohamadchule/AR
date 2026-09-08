import type { Product } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { ProductCreateInput, ProductUpdateInput } from "@/lib/validation";

/**
 * Product data-access layer.
 *
 * All product reads/writes go through this module — API routes and pages never
 * touch Prisma directly. It also owns the DTO serializers that decide what the
 * admin vs the public experience is allowed to see (the opaque storage key is
 * never exposed to clients).
 */

/** Metadata about a product's stored model, for admin surfaces. */
export interface AdminModelInfo {
  originalName: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  updatedAt: string | null;
}

/** Shape returned to admin surfaces. */
export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  hasModel: boolean;
  /** Stable, cache-busted URL that streams the current GLB. */
  modelUrl: string | null;
  model: AdminModelInfo;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned to the public product page (no internal fields). */
export interface PublicProduct {
  id: string;
  name: string;
  description: string;
  hasModel: boolean;
  modelUrl: string | null;
  thumbnailUrl: string | null;
}

/** Stable public path that streams a product's current model. */
export function modelUrlPath(product: Product): string | null {
  if (!product.modelKey) return null;
  // Cache-bust with the model's last-updated time so a replaced GLB is fetched.
  const version = product.modelUpdatedAt?.getTime() ?? 0;
  return `/api/products/${product.id}/model?v=${version}`;
}

export function toAdminProduct(product: Product): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    isActive: product.isActive,
    hasModel: Boolean(product.modelKey),
    modelUrl: modelUrlPath(product),
    model: {
      originalName: product.modelOriginalName,
      contentType: product.modelContentType,
      sizeBytes:
        product.modelSizeBytes === null ? null : Number(product.modelSizeBytes),
      updatedAt: product.modelUpdatedAt?.toISOString() ?? null,
    },
    thumbnailUrl: product.thumbnailUrl,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toPublicProduct(product: Product): PublicProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    hasModel: Boolean(product.modelKey),
    modelUrl: modelUrlPath(product),
    thumbnailUrl: product.thumbnailUrl,
  };
}

// --- Queries -------------------------------------------------------------

export async function listProducts(): Promise<Product[]> {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getProductById(id: string): Promise<Product | null> {
  return prisma.product.findUnique({ where: { id } });
}

/** Public read: only returns the product if it exists and is active. */
export async function getActiveProductById(
  id: string,
): Promise<Product | null> {
  const product = await prisma.product.findUnique({ where: { id } });
  return product && product.isActive ? product : null;
}

// --- Mutations -----------------------------------------------------------

export async function createProduct(
  input: ProductCreateInput,
): Promise<Product> {
  return prisma.product.create({
    data: {
      name: input.name,
      description: input.description ?? "",
    },
  });
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
): Promise<Product | null> {
  try {
    return await prisma.product.update({
      where: { id },
      data: input,
    });
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** Record a freshly uploaded/replaced model on the product. */
export async function setProductModel(
  id: string,
  model: {
    key: string;
    originalName: string;
    contentType: string;
    sizeBytes: number;
  },
): Promise<Product | null> {
  try {
    return await prisma.product.update({
      where: { id },
      data: {
        modelKey: model.key,
        modelOriginalName: model.originalName,
        modelContentType: model.contentType,
        modelSizeBytes: BigInt(model.sizeBytes),
        modelUpdatedAt: new Date(),
      },
    });
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<Product | null> {
  try {
    return await prisma.product.delete({ where: { id } });
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

// --- Helpers -------------------------------------------------------------

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}
