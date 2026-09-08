"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EditProductForm({
  id,
  initialName,
  initialDescription,
  initialActive,
}: {
  id: string;
  initialName: string;
  initialDescription: string;
  initialActive: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isActive, setIsActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isActive,
        }),
      });
      if (!res.ok) {
        setError("Failed to save changes.");
        return;
      }
      setMessage("Saved.");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="edit-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-current dark:border-white/20"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-desc" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-current dark:border-white/20"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
        />
        Active (visible on the public page)
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {message && (
          <span className="text-xs text-green-600 dark:text-green-400">
            {message}
          </span>
        )}
        {error && (
          <span className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
