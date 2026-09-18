import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/**
 * Shared cache for public, visitor-independent storefront reads — settings,
 * the navigation categories, hero slides, featured reviews.
 *
 * These are read on every page view and change only when someone saves in the
 * admin, so each page view no longer pays a database round trip for them.
 * Admin mutations call `revalidateStorefront()`, which drops the lot at once;
 * the five-minute lifetime is only a safety net.
 *
 * Only JSON-safe values may pass through here: the data cache serialises
 * results, so a Prisma Decimal or Date would come back as a string.
 */
export const STOREFRONT_TAG = "storefront";

export function cachedStorefront<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  key: string
) {
  return unstable_cache(fn, ["storefront", key], {
    revalidate: 300,
    tags: [STOREFRONT_TAG],
  });
}

/** Call after any admin change a shopper could see. */
export function revalidateStorefront() {
  revalidateTag(STOREFRONT_TAG);
  revalidatePath("/", "layout");
}
