"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteProductButton({
  id,
  name,
  redirectTo,
  className,
}: {
  id: string;
  name: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const ok = window.confirm(
      `Delete "${name}"? This permanently removes the product and its 3D model. This cannot be undone.`,
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        window.alert("Failed to delete the product. Please try again.");
        return;
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className={
        className ??
        "rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
      }
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
