import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import DeleteProductButton from "@/components/admin/DeleteProductButton";
import EditProductForm from "@/components/admin/EditProductForm";
import ModelManager from "@/components/admin/ModelManager";
import QrPanel from "@/components/admin/QrPanel";
import ModelViewer from "@/components/ModelViewer";
import { getProductById, toAdminProduct } from "@/lib/products";
import { buildViewUrlFromHeaders } from "@/lib/url";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-xl border border-black/10 p-5 dark:border-white/10"
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide opacity-60">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const dto = toAdminProduct(product);
  const publicUrl = buildViewUrlFromHeaders(await headers(), id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-6">
      <div>
        <Link
          href="/admin/products"
          className="text-sm opacity-60 hover:underline"
        >
          ← Products
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{dto.name}</h1>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              dto.isActive
                ? "bg-green-500/15 text-green-700 dark:text-green-300"
                : "bg-black/10 opacity-70 dark:bg-white/10"
            }`}
          >
            {dto.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <Section title="Preview">
        <div className="h-72 w-full overflow-hidden rounded-lg border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900">
          {dto.hasModel && dto.modelUrl ? (
            <ModelViewer src={dto.modelUrl} alt={`3D model of ${dto.name}`} />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm opacity-60">
              No model uploaded yet.
            </div>
          )}
        </div>
      </Section>

      <Section title="Details">
        <EditProductForm
          id={dto.id}
          initialName={dto.name}
          initialDescription={dto.description}
          initialActive={dto.isActive}
        />
      </Section>

      <Section title="3D model">
        <ModelManager
          id={dto.id}
          hasModel={dto.hasModel}
          originalName={dto.model.originalName}
          sizeBytes={dto.model.sizeBytes}
        />
      </Section>

      <Section title="Public URL & QR code" id="qr">
        <QrPanel id={dto.id} publicUrl={publicUrl} />
      </Section>

      <Section title="Danger zone">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs opacity-60">
            Permanently delete this product and its model. To hide it without
            deleting, set it inactive in Details.
          </p>
          <DeleteProductButton
            id={dto.id}
            name={dto.name}
            redirectTo="/admin/products"
          />
        </div>
      </Section>
    </main>
  );
}
