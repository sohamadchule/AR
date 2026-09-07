import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">AR Product Viewer</h1>
        <p className="max-w-md text-sm text-black/60 dark:text-white/60">
          Upload a 3D model, publish a product, and share a QR code that opens a
          mobile web page where customers view the model and place it in AR.
        </p>
      </div>
      <Link
        href="/admin"
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Go to Admin
      </Link>
    </main>
  );
}
