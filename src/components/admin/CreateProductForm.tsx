"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { uploadModel } from "@/lib/client/upload-model";

type Step = { label: string; done: boolean };

export default function CreateProductForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);

  function setStepDone(index: number) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, done: true } : s)),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }
    if (file && !file.name.toLowerCase().endsWith(".glb")) {
      setError("The model must be a .glb file.");
      return;
    }

    const plan: Step[] = [
      { label: "Product created", done: false },
      ...(file ? [{ label: "Model uploaded", done: false }] : []),
      { label: "Public URL generated", done: false },
      { label: "QR generated", done: false },
    ];
    setSteps(plan);
    setSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        setError("Failed to create the product.");
        setSubmitting(false);
        return;
      }
      const { product } = (await res.json()) as { product: { id: string } };
      setStepDone(0);

      let nextStep = 1;
      if (file) {
        await uploadModel(product.id, file, setProgress);
        setStepDone(1);
        nextStep = 2;
      }
      // Public URL + QR are derived from the stable product id — nothing to
      // persist; mark them done for the operator's confidence.
      setStepDone(nextStep);
      setStepDone(nextStep + 1);

      router.push(`/admin/products/${product.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Modern Chair"
          required
          disabled={submitting}
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-current disabled:opacity-60 dark:border-white/20"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Wooden dining chair"
          rows={3}
          disabled={submitting}
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-current disabled:opacity-60 dark:border-white/20"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="model" className="block text-sm font-medium">
          3D model (GLB)
        </label>
        <input
          id="model"
          type="file"
          accept=".glb,model/gltf-binary"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={submitting}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background disabled:opacity-60"
        />
        <p className="text-xs opacity-50">
          Optional now — you can add or replace the model later. GLB only.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {steps.length > 0 && (
        <ul className="space-y-1 text-sm" aria-live="polite">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className={
                  s.done ? "text-green-600 dark:text-green-400" : "opacity-40"
                }
              >
                {s.done ? "✓" : "○"}
              </span>
              <span className={s.done ? "" : "opacity-60"}>
                {s.label}
                {i === 1 && file && !s.done && progress > 0
                  ? ` — ${progress}%`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create product"}
      </button>
    </form>
  );
}
