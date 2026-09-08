import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import ProductView from "@/components/ProductView";
import { getActiveProductById, toPublicProduct } from "@/lib/products";

// Deduplicate the lookup between generateMetadata and the page render.
const loadProduct = cache(getActiveProductById);

type PageProps = { params: Promise<{ productId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await loadProduct(productId);
  if (!product) {
    return { title: "Product not found" };
  }
  return {
    title: product.name,
    description: product.description || `View ${product.name} in 3D and AR`,
    openGraph: {
      title: product.name,
      description: product.description || `View ${product.name} in 3D and AR`,
    },
  };
}

export default async function PublicProductPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await loadProduct(productId);
  if (!product) {
    notFound();
  }
  return <ProductView product={toPublicProduct(product)} />;
}
