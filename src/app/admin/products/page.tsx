import Link from "next/link";

import DeleteProductButton from "@/components/admin/DeleteProductButton";
import LogoutButton from "@/components/LogoutButton";
import { formatDate } from "@/lib/format";
import { listProducts, toAdminProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = (await listProducts()).map(toAdminProduct);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm opacity-60">{products.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            New product
          </Link>
          <LogoutButton />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 p-12 text-center dark:border-white/15">
          <p className="text-sm font-medium">No products yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs opacity-60">
            Create your first product and upload a GLB model to generate a
            public page and QR code.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Create product
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide opacity-60 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 opacity-70">
                    {p.hasModel ? (
                      p.model.originalName ?? "model.glb"
                    ) : (
                      <span className="opacity-50">— none —</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.isActive
                          ? "bg-green-500/15 text-green-700 dark:text-green-300"
                          : "bg-black/10 opacity-70 dark:bg-white/10"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 opacity-70">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/view/${p.id}`}
                        target="_blank"
                        className="rounded-md border border-current px-2.5 py-1 text-xs opacity-80 hover:opacity-100"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="rounded-md border border-current px-2.5 py-1 text-xs opacity-80 hover:opacity-100"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/products/${p.id}#qr`}
                        className="rounded-md border border-current px-2.5 py-1 text-xs opacity-80 hover:opacity-100"
                      >
                        QR
                      </Link>
                      <DeleteProductButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
