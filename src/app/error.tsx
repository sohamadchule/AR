"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm opacity-60">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
      >
        Try again
      </button>
    </main>
  );
}
