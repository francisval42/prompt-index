// Not wired to any route yet: the router in main.tsx sends unknown paths to
// the index. Kept on-brand so future routing work can mount it as-is.
export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-mono text-foreground p-4 sm:p-6">
      <div className="w-full max-w-lg border border-border p-6 sm:p-8">
        <h1 className="text-base font-bold uppercase tracking-wide">
          404 — Page not found
        </h1>
        <p className="mt-3 text-sm text-muted">
          This page doesn&apos;t exist. It may have moved, or the link is
          wrong.
        </p>
        <a
          href={import.meta.env.BASE_URL}
          className="mt-6 inline-block border border-border px-6 py-3 text-sm font-bold text-accent hover:bg-[#111] active:bg-[#111] touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent outline-none transition-none"
        >
          Back to index
        </a>
      </div>
    </div>
  );
}
