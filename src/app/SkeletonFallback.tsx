/** Suspense fallback shown while a lazy route loads. */
export function SkeletonFallback() {
  return (
    <div className="space-y-3 p-6" role="status" aria-busy="true" aria-label="Loading">
      <div className="h-6 w-1/3 animate-pulse rounded-md bg-surface-2" />
      <div className="h-4 w-2/3 animate-pulse rounded-md bg-surface-2" />
      <div className="h-32 w-full animate-pulse rounded-lg bg-surface-1" />
    </div>
  );
}
