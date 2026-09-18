import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Node = { slug: string; name: string; children: { slug: string; name: string }[] };

/**
 * One-tap switching between departments, then between the categories inside
 * the chosen one — the fastest way across a store that sells more than one
 * kind of thing. Links, not buttons: every state is a shareable URL.
 */
export function CategoryChips({
  tree,
  current,
  basePath = "/shop",
  sort,
}: {
  tree: Node[];
  current?: string;
  basePath?: string;
  sort?: string;
}) {
  if (tree.length === 0) return null;

  const tiered = tree.some((d) => d.children.length > 0);
  const department = current
    ? tree.find((d) => d.slug === current || d.children.some((c) => c.slug === current))
    : undefined;

  const href = (slug?: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (sort && sort !== "featured") params.set("sort", sort);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  // Flat stores show their categories; tiered ones show departments first.
  const topLevel = tiered ? tree : tree.flatMap((d) => [d, ...d.children]);

  return (
    <nav aria-label="Browse by category" className="space-y-3">
      <ChipRow>
        <Chip href={href()} active={!current}>
          All
        </Chip>
        {topLevel.map((d) => (
          <Chip key={d.slug} href={href(d.slug)} active={tiered ? department?.slug === d.slug : current === d.slug}>
            {d.name}
          </Chip>
        ))}
      </ChipRow>

      {tiered && department && department.children.length > 0 && (
        <ChipRow>
          <Chip href={href(department.slug)} active={current === department.slug} subtle>
            All {department.name}
          </Chip>
          {department.children.map((c) => (
            <Chip key={c.slug} href={href(c.slug)} active={current === c.slug} subtle>
              {c.name}
            </Chip>
          ))}
        </ChipRow>
      )}
    </nav>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    // Scrolls sideways on phones instead of wrapping into a tall block.
    <div className="rail-scroll -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
      {children}
    </div>
  );
}

function Chip({
  href,
  active,
  subtle = false,
  children,
}: {
  href: string;
  active: boolean;
  subtle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-pill border px-4 text-[0.8rem] font-medium transition-colors",
        active
          ? subtle
            ? "border-gold-ink bg-gold/15 text-foreground"
            : "border-ink bg-ink text-ivory"
          : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
