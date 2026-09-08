"use client";

import { useState } from "react";

import ModelViewer from "@/components/ModelViewer";

// A well-known public sample GLB, used only for this development demo page.
const SAMPLE_GLB = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

/**
 * Development demo for the standalone GLB viewer (Milestone 2).
 *
 * Not part of the product flow — it exists to exercise the viewer against any
 * GLB URL, including deliberately broken ones, to verify loading, error, retry,
 * and reset behavior.
 */
export default function ViewerDemoPage() {
  const [src, setSrc] = useState(SAMPLE_GLB);
  const [input, setInput] = useState(SAMPLE_GLB);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">GLB viewer demo</h1>
        <p className="text-xs opacity-60">
          Paste any GLB URL to test loading, errors, retry, and camera controls.
        </p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSrc(input.trim());
        }}
      >
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://…/model.glb"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-current dark:border-white/20"
          aria-label="GLB URL"
        />
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Load
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          className="rounded-full border border-current px-3 py-1 opacity-80 hover:opacity-100"
          onClick={() => {
            setInput(SAMPLE_GLB);
            setSrc(SAMPLE_GLB);
          }}
        >
          Load sample
        </button>
        <button
          type="button"
          className="rounded-full border border-current px-3 py-1 opacity-80 hover:opacity-100"
          onClick={() => {
            const broken = "https://modelviewer.dev/shared-assets/models/DOES-NOT-EXIST.glb";
            setInput(broken);
            setSrc(broken);
          }}
        >
          Test broken URL
        </button>
      </div>

      <div className="aspect-square w-full overflow-hidden rounded-xl border border-black/10 bg-neutral-100 dark:border-white/10 dark:bg-neutral-900 sm:aspect-video">
        <ModelViewer src={src} alt="Demo 3D model" ar autoRotate />
      </div>
      <p className="text-xs opacity-50">
        AR is enabled here. On a supported phone (Android/Chrome or iOS/Safari)
        a &ldquo;View in AR&rdquo; button appears once the model loads; on
        unsupported devices you&rsquo;ll see a message instead, and the 3D viewer
        keeps working.
      </p>
    </main>
  );
}
