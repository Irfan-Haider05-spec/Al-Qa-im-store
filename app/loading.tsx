export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
