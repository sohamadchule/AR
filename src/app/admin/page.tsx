import Link from "next/link";

import LogoutButton from "@/components/LogoutButton";

/**
 * Minimal admin landing. Access is gated by middleware (see src/middleware.ts).
 * The full products dashboard is built in a later milestone.
 */
export default function AdminHomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm opacity-60">
        Manage your products, upload models, and generate QR codes.
      </p>
      <div className="mt-6">
        <Link
          href="/admin/products"
          className="inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          View products
        </Link>
      </div>
    </main>
  );
}
