import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide opacity-50">
        404
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm opacity-60">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
      >
        Go home
      </Link>
    </main>
  );
}
