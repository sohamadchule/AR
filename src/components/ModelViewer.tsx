"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ModelViewerElement } from "@/types/model-viewer";

type Status = "loading" | "loaded" | "error";

export interface ModelViewerProps {
  /** URL of the GLB to load (e.g. the stable /api/products/<id>/model route). */
  src: string;
  /** Accessible description of the model. */
  alt?: string;
  /** Optional poster image shown while the model loads. */
  poster?: string;
  /** Extra classes for the outer container. */
  className?: string;
  /** Enable AR affordances (Scene Viewer / Quick Look). Off by default. */
  ar?: boolean;
  /** Optional iOS USDZ source for Quick Look (falls back to GLB otherwise). */
  iosSrc?: string;
  /** Auto-rotate the model when idle. */
  autoRotate?: boolean;
}

/**
 * Reusable 3D viewer built on <model-viewer>.
 *
 * Loads the web component on the client only, exposes camera controls
 * (rotate/zoom/pan), and handles loading, progress, load failure (missing /
 * corrupted model or network/storage error), retry, and camera reset. The same
 * component powers both the admin preview and the public product page; AR is a
 * prop so the public page can turn it on.
 */
export default function ModelViewer({
  src,
  alt,
  poster,
  className,
  ar = false,
  iosSrc,
  autoRotate = false,
}: ModelViewerProps) {
  const ref = useRef<ModelViewerElement>(null);
  const [defined, setDefined] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState(0);

  // Register the custom element on the client only.
  useEffect(() => {
    let active = true;
    import("@google/model-viewer")
      .then(() => {
        if (active) setDefined(true);
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  // Reset visual state whenever the model source changes.
  useEffect(() => {
    setStatus("loading");
    setProgress(0);
  }, [src]);

  // Wire model-viewer events once the element is present.
  useEffect(() => {
    const el = ref.current;
    if (!el || !defined) return;

    const onLoad = () => setStatus("loaded");
    const onError = () => setStatus("error");
    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ totalProgress?: number }>).detail;
      if (detail?.totalProgress !== undefined) {
        setProgress(Math.round(detail.totalProgress * 100));
      }
    };

    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    el.addEventListener("progress", onProgress as EventListener);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
      el.removeEventListener("progress", onProgress as EventListener);
    };
  }, [defined, src]);

  const handleReset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.cameraOrbit = "0deg 75deg 105%";
    el.cameraTarget = "auto auto auto";
    el.fieldOfView = "auto";
  }, []);

  const handleRetry = useCallback(() => {
    const el = ref.current;
    setStatus("loading");
    setProgress(0);
    if (!el) return;
    // Force a reload by clearing and re-setting the src attribute.
    el.removeAttribute("src");
    requestAnimationFrame(() => {
      el.setAttribute("src", src);
    });
  }, [src]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className ?? ""}`}
      data-status={status}
    >
      {defined && (
        <model-viewer
          ref={ref}
          src={src}
          alt={alt ?? "Interactive 3D model"}
          poster={poster}
          camera-controls
          touch-action="pan-y"
          shadow-intensity="1"
          exposure="1"
          reveal="auto"
          auto-rotate={autoRotate}
          interaction-prompt="auto"
          {...(ar
            ? {
                ar: true,
                "ar-modes": "webxr scene-viewer quick-look",
                "ar-scale": "fixed" as const,
                ...(iosSrc ? { "ios-src": iosSrc } : {}),
              }
            : {})}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
        />
      )}

      {status === "loading" && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3"
          role="status"
          aria-live="polite"
        >
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60"
            aria-hidden
          />
          <p className="text-xs text-current opacity-60">
            Loading model{progress > 0 ? ` — ${progress}%` : "…"}
          </p>
        </div>
      )}

      {status === "error" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
          role="alert"
        >
          <p className="text-sm font-medium">Couldn&apos;t load the 3D model</p>
          <p className="max-w-xs text-xs opacity-70">
            The model may be missing, corrupted, or unavailable right now.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full border border-current px-4 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          >
            Try again
          </button>
        </div>
      )}

      {status === "loaded" && (
        <button
          type="button"
          onClick={handleReset}
          className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-opacity hover:opacity-80"
          aria-label="Reset camera view"
        >
          Reset view
        </button>
      )}
    </div>
  );
}
