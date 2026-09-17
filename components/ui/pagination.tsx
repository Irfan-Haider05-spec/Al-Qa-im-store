import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link
          href={makeHref(page - 1)}
          className="rounded-control border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Prev
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={makeHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`rounded-control px-3.5 py-2 text-sm ${
            p === page
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:bg-muted"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          href={makeHref(page + 1)}
          className="rounded-control border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
