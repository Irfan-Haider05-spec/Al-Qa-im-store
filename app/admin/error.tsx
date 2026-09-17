"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <h1 className="font-display text-xl font-bold">Admin error</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong loading this section.
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex h-10 items-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
