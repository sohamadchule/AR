export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-xl font-semibold">Product not available</h1>
      <p className="max-w-xs text-sm opacity-60">
        This product may have been removed or is not currently available. Please
        check the link or try again later.
      </p>
    </main>
  );
}
