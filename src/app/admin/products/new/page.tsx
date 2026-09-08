import Link from "next/link";

import CreateProductForm from "@/components/admin/CreateProductForm";

export default function NewProductPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm opacity-60 hover:underline"
        >
          ← Products
        </Link>
        <h1 className="mt-2 text-xl font-semibold">New product</h1>
      </div>
      <CreateProductForm />
    </main>
  );
}
