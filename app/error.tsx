"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, send to your error tracker here.
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center rounded-pill bg-primary px-6 font-medium text-primary-foreground hover:bg-primary-deep"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
