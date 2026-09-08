"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { uploadModel } from "@/lib/client/upload-model";
import { formatBytes } from "@/lib/format";

export default function ModelManager({
  id,
  hasModel,
  originalName,
  sizeBytes,
}: {
  id: string;
  hasModel: boolean;
  originalName: string | null;
  sizeBytes: number | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function onUpload() {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".glb")) {
      setError("The model must be a .glb file.");
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      await uploadModel(id, file, setProgress);
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm">
        {hasModel ? (
          <p className="opacity-70">
            Current model:{" "}
            <span className="font-medium">{originalName ?? "model.glb"}</span>{" "}
            <span className="opacity-60">({formatBytes(sizeBytes)})</span>
          </p>
        ) : (
          <p className="opacity-70">No model uploaded yet.</p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".glb,model/gltf-binary"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onUpload}
          disabled={!file || busy}
          className="shrink-0 rounded-md border border-current px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          {busy
            ? `Uploading… ${progress}%`
            : hasModel
              ? "Replace model"
              : "Upload model"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {hasModel && (
        <p className="text-xs opacity-50">
          Replacing the model keeps the same public URL and QR code.
        </p>
      )}
    </div>
  );
}
