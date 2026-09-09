import ModelViewer from "@/components/ModelViewer";
import type { PublicProduct } from "@/lib/products";

/**
 * Mobile-first public product page.
 *
 * Layout (approximately):
 *   Product name
 *   [ 3D model ]  ← large, primary; hosts the "View in AR" button
 *   Rotate / Zoom / Explore
 *   Description
 *
 * The 3D viewer keeps working even when AR is unsupported; a missing model is
 * handled gracefully rather than leaving the page broken.
 */
export default function ProductView({ product }: { product: PublicProduct }) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col">
      <header className="px-5 pb-2 pt-6">
        <h1 className="text-xl font-semibold tracking-tight">{product.name}</h1>
      </header>

      <div className="relative mx-4 min-h-[55vh] flex-1 overflow-hidden rounded-2xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900">
        {product.hasModel && product.modelUrl ? (
          /* The wrapper gives the viewer a definite box: its parent sizes
             itself with `min-h` + `flex-1`, which is not a definite height, so
             the viewer's own `h-full` would resolve to 0 and render nothing. */
          <div className="absolute inset-0">
            <ModelViewer
              src={product.modelUrl}
              alt={`3D model of ${product.name}`}
              ar
              showArButton
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium">3D model unavailable</p>
            <p className="max-w-xs text-xs opacity-60">
              This product doesn&apos;t have a 3D model yet. Please check back
              soon.
            </p>
          </div>
        )}
      </div>

      <p className="px-5 pt-3 text-center text-xs uppercase tracking-wide opacity-50">
        Rotate · Zoom · Explore
      </p>

      {product.description && (
        <section className="px-5 pb-10 pt-4">
          <p className="whitespace-pre-line text-sm leading-relaxed opacity-80">
            {product.description}
          </p>
        </section>
      )}
    </main>
  );
}
