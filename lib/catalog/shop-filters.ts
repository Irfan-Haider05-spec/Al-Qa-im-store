/**
 * The filter groups the shop sidebar can show, and how the admin's choice of
 * which to show (and in what order) is stored.
 *
 * Kept free of server imports: the admin editor and the storefront sidebar
 * both use it.
 */
export const FILTER_GROUPS = {
  category: { label: "Category", hint: "Departments and their categories" },
  brand: { label: "Brand", hint: "Only brands marked visible in Admin → Brands" },
  gender: { label: "Gender", hint: "Men, Women, Unisex, Kids" },
  size: { label: "Size", hint: "Sizes of the products in view — shoe sizes in Footwear, S–XL in Clothing" },
  color: { label: "Colour", hint: "Colours of the products in view" },
  price: { label: "Price", hint: "Minimum and maximum price" },
  rating: { label: "Rating", hint: "4 stars & up, 3 stars & up" },
  availability: { label: "Availability", hint: "In stock only, On sale only" },
} as const;

export type FilterKey = keyof typeof FILTER_GROUPS;
export type FilterSetting = { key: FilterKey; enabled: boolean };

export const DEFAULT_FILTERS: FilterSetting[] = (
  Object.keys(FILTER_GROUPS) as FilterKey[]
).map((key) => ({ key, enabled: true }));

function isFilterKey(value: unknown): value is FilterKey {
  return typeof value === "string" && value in FILTER_GROUPS;
}

/**
 * Reads whatever is stored (possibly nothing, possibly from an older version)
 * into a complete, ordered list: unknown keys are dropped, duplicates ignored,
 * and any group added in a later release is appended, switched on.
 */
export function normaliseFilters(raw: unknown): FilterSetting[] {
  const seen = new Set<FilterKey>();
  const out: FilterSetting[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const key = (item as { key?: unknown })?.key;
      if (!isFilterKey(key) || seen.has(key)) continue;
      seen.add(key);
      out.push({ key, enabled: (item as { enabled?: unknown }).enabled !== false });
    }
  }
  for (const def of DEFAULT_FILTERS) {
    if (!seen.has(def.key)) out.push({ ...def });
  }
  return out;
}

/** The groups to render, in order. */
export function enabledFilterKeys(raw: unknown): FilterKey[] {
  return normaliseFilters(raw)
    .filter((f) => f.enabled)
    .map((f) => f.key);
}

/**
 * Size labels in the order a shopper expects: numeric sizes ascending
 * (shoe sizes, waists), then letter sizes XXS → 4XL, then anything else
 * alphabetically, with "One size" last.
 */
const LETTER_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL", "5XL"];

export function compareSizes(a: string, b: string): number {
  const rank = (label: string): [number, number, string] => {
    const t = label.trim().toUpperCase();
    const n = Number(t.replace(",", "."));
    if (t !== "" && !Number.isNaN(n)) return [0, n, t];
    const letter = LETTER_ORDER.indexOf(t);
    if (letter !== -1) return [1, letter, t];
    if (/^ONE[\s-]?SIZE$/.test(t)) return [3, 0, t];
    return [2, 0, t];
  };
  const [ga, na, ta] = rank(a);
  const [gb, nb, tb] = rank(b);
  return ga - gb || na - nb || ta.localeCompare(tb);
}
