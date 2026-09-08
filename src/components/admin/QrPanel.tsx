"use client";

import { useState } from "react";

export default function QrPanel({
  id,
  publicUrl,
}: {
  id: string;
  publicUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/products/${id}/qr`}
          alt="QR code for the public product page"
          width={176}
          height={176}
          className="h-44 w-44 rounded-lg border border-black/10 bg-white p-2 dark:border-white/10"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide opacity-50">
            Public URL
          </p>
          <div className="flex items-center gap-2">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate rounded-md border border-black/10 px-3 py-2 text-sm underline-offset-2 hover:underline dark:border-white/10"
            >
              {publicUrl}
            </a>
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 rounded-md border border-current px-3 py-2 text-xs font-medium"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs opacity-50">
            The QR code encodes this URL only — never the model file — so a
            replaced model keeps working.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/products/${id}/qr?download=1`}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Download PNG
          </a>
          <a
            href={`/api/products/${id}/qr?format=svg&download=1`}
            className="rounded-md border border-current px-4 py-2 text-sm font-medium"
          >
            Download SVG
          </a>
        </div>
      </div>
    </div>
  );
}
