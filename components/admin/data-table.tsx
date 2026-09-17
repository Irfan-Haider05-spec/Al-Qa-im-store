import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

// Server-rendered table. Search/sort/pagination are driven by the page via URL
// params and passed-in data — this component just renders.
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  rowHref,
  empty = "Nothing to show.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowHref?: (row: T) => string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-background">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left">
            {columns.map((c, i) => (
              <th key={i} className={cn("px-4 py-3 font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const content = columns.map((c, i) => (
              <td key={i} className={cn("px-4 py-3", c.className)}>
                {c.cell(row)}
              </td>
            ));
            return (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                {rowHref ? (
                  <>
                    {columns.map((c, i) => (
                      <td key={i} className={cn("px-4 py-3", c.className)}>
                        <Link href={rowHref(row)} className="block">
                          {c.cell(row)}
                        </Link>
                      </td>
                    ))}
                  </>
                ) : (
                  content
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
