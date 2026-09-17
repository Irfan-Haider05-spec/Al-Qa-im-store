import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchSuggestions } from "@/lib/products/queries";

const querySchema = z.object({
  q: z.string().trim().min(2).max(64),
});

/**
 * Type-ahead suggestions for the header search.
 *
 * Read-only and public, but still validated and length-capped: the term goes
 * into a `contains` filter, and an unbounded string is an easy way to make the
 * database do pointless work. Results are cached briefly at the edge because
 * the catalogue changes far more slowly than people type.
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchSuggestions(parsed.data.q);
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } }
    );
  } catch {
    // Never leak a database error to the client — an empty list degrades the
    // panel to "no matches" and the full search page still works.
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
