import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-primary">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-pill bg-primary px-6 font-medium text-primary-foreground hover:bg-primary-deep"
          >
            Go home
          </Link>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center rounded-pill border border-border px-6 text-sm hover:bg-muted"
          >
            Browse shop
          </Link>
        </div>
      </div>
    </div>
  );
}
