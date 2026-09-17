export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-control bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-card bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card bg-muted" />
    </div>
  );
}
