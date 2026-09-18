"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { saveProductOptions } from "@/lib/admin/variant-actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

type Colour = { key: string; id?: string; name: string; hex: string };
type Size = { key: string; id?: string; label: string };

const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: "Shoes · UK 6–12", sizes: ["6", "7", "8", "9", "10", "11", "12"] },
  { label: "Shoes · EU 39–46", sizes: ["39", "40", "41", "42", "43", "44", "45", "46"] },
  { label: "Clothing · XS–XXL", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { label: "Trousers · waist 28–40", sizes: ["28", "30", "32", "34", "36", "38", "40"] },
];

const COLOUR_PRESETS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#F4F4F2" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Grey", hex: "#8A8D91" },
  { name: "Brown", hex: "#6B4226" },
  { name: "Beige", hex: "#D8C3A5" },
  { name: "Olive", hex: "#5C6B3C" },
  { name: "Blue", hex: "#2F5DA8" },
  { name: "Red", hex: "#B3261E" },
];

let tempId = 0;
const nextKey = () => `new-${++tempId}`;
const NONE = "-";

const field =
  "rounded-control border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

/**
 * Colours, sizes and the stock of every combination, on the product's own
 * page. This is what makes a product sellable: each colour × size pair is a
 * variant with its own stock, and the storefront offers exactly these.
 */
export function ProductOptionsManager({
  productId,
  initialColours,
  initialSizes,
  initialStock,
}: {
  productId: string;
  initialColours: { id: string; name: string; hex: string }[];
  initialSizes: { id: string; label: string }[];
  /** Stock keyed by `${colourId ?? "-"}|${sizeId ?? "-"}`. */
  initialStock: Record<string, number>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [colours, setColours] = useState<Colour[]>(
    initialColours.map((c) => ({ key: c.id, id: c.id, name: c.name, hex: c.hex }))
  );
  const [sizes, setSizes] = useState<Size[]>(
    initialSizes.map((s) => ({ key: s.id, id: s.id, label: s.label }))
  );
  const [stock, setStock] = useState<Record<string, number>>(initialStock);
  const [newColour, setNewColour] = useState({ name: "", hex: "#111111" });
  const [newSize, setNewSize] = useState("");
  const [fillValue, setFillValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rowKeys = colours.length ? colours.map((c) => c.key) : [NONE];
  const colKeys = sizes.length ? sizes.map((s) => s.key) : [NONE];
  const cell = (r: string, c: string) => stock[`${r}|${c}`] ?? 0;
  const total = useMemo(
    () => rowKeys.reduce((sum, r) => sum + colKeys.reduce((n, c) => n + cell(r, c), 0), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stock, colours, sizes]
  );

  /** When the first colour/size arrives, carry the old single row/column across. */
  function adoptDefault(kind: "row" | "col", newKey: string) {
    setStock((current) => {
      const next = { ...current };
      for (const [k, v] of Object.entries(current)) {
        const [r, c] = k.split("|");
        if (kind === "row" && r === NONE) next[`${newKey}|${c}`] = v;
        if (kind === "col" && c === NONE) next[`${r}|${newKey}`] = v;
      }
      return next;
    });
  }

  function addColour(name: string, hex: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (colours.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already listed.`);
      return;
    }
    setError(null);
    const key = nextKey();
    if (colours.length === 0) adoptDefault("row", key);
    setColours((list) => [...list, { key, name: trimmed, hex }]);
  }

  function addSizes(labels: string[]) {
    const existing = new Set(sizes.map((s) => s.label.toLowerCase()));
    const fresh = labels.map((l) => l.trim()).filter((l) => l && !existing.has(l.toLowerCase()));
    if (!fresh.length) return;
    setError(null);
    const added = fresh.map((label) => ({ key: nextKey(), label }));
    if (sizes.length === 0) adoptDefault("col", added[0].key);
    setSizes((list) => [...list, ...added]);
  }

  function moveSize(index: number, delta: -1 | 1) {
    setSizes((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function fillAll() {
    const value = Math.max(0, Math.floor(Number(fillValue)));
    if (!Number.isFinite(value)) return;
    setStock((current) => {
      const next = { ...current };
      for (const r of rowKeys) for (const c of colKeys) next[`${r}|${c}`] = value;
      return next;
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveProductOptions(productId, {
        colors: colours.map((c) => ({ id: c.id, name: c.name, hex: c.hex })),
        sizes: sizes.map((s) => ({ id: s.id, label: s.label })),
        stock: rowKeys.map((r) => colKeys.map((c) => cell(r, c))),
      });
      if (res.ok) {
        toast("Options and stock saved.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <section className="rounded-card border border-border bg-background p-5">
      <h2 className="font-display text-xl font-semibold">Sizes, colours &amp; stock</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Each colour × size is a variant with its own stock. Leave sizes empty for one-size items
        (a belt, a cap); leave colours empty if it comes in one colour.
      </p>

      {/* ---------------------------------------------------------- colours */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold">Colours</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {colours.length === 0 && (
            <span className="text-sm text-muted-foreground">One colour only (none listed).</span>
          )}
          {colours.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-2 rounded-pill border border-border py-1 pl-1.5 pr-2 text-sm"
            >
              <input
                type="color"
                value={c.hex}
                aria-label={`${c.name} colour`}
                onChange={(e) =>
                  setColours((list) => list.map((x) => (x.key === c.key ? { ...x, hex: e.target.value } : x)))
                }
                className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />
              <input
                value={c.name}
                aria-label="Colour name"
                onChange={(e) =>
                  setColours((list) => list.map((x) => (x.key === c.key ? { ...x, name: e.target.value } : x)))
                }
                className="w-24 bg-transparent text-sm focus:outline-none"
              />
              <button
                type="button"
                aria-label={`Remove ${c.name}`}
                onClick={() => setColours((list) => list.filter((x) => x.key !== c.key))}
                className="text-muted-foreground hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>

        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addColour(newColour.name, newColour.hex);
            setNewColour((c) => ({ ...c, name: "" }));
          }}
        >
          <input
            value={newColour.name}
            onChange={(e) => setNewColour((c) => ({ ...c, name: e.target.value }))}
            placeholder="Colour name"
            aria-label="New colour name"
            className={cn(field, "w-40")}
          />
          <input
            type="color"
            value={newColour.hex}
            onChange={(e) => setNewColour((c) => ({ ...c, hex: e.target.value }))}
            aria-label="New colour swatch"
            className="h-9 w-11 cursor-pointer rounded-control border border-border bg-background p-1"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1 rounded-pill border border-border px-3 text-sm hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Add colour
          </button>
          <span className="mx-1 text-xs text-muted-foreground">or quick add:</span>
          {COLOUR_PRESETS.filter(
            (p) => !colours.some((c) => c.name.toLowerCase() === p.name.toLowerCase())
          ).map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => addColour(p.name, p.hex)}
              className="inline-flex h-7 items-center gap-1.5 rounded-pill border border-border px-2.5 text-xs hover:bg-muted"
            >
              <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: p.hex }} />
              {p.name}
            </button>
          ))}
        </form>
      </div>

      {/* ------------------------------------------------------------ sizes */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold">Sizes</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizes.length === 0 && (
            <span className="text-sm text-muted-foreground">One size (none listed).</span>
          )}
          {sizes.map((s, i) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1 rounded-pill border border-border py-1 pl-1 pr-2 text-sm"
            >
              <button
                type="button"
                aria-label={`Move ${s.label} left`}
                disabled={i === 0}
                onClick={() => moveSize(i, -1)}
                className="text-muted-foreground hover:text-foreground disabled:opacity-25"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <input
                value={s.label}
                aria-label="Size label"
                onChange={(e) =>
                  setSizes((list) => list.map((x) => (x.key === s.key ? { ...x, label: e.target.value } : x)))
                }
                className="w-12 bg-transparent text-center text-sm focus:outline-none"
              />
              <button
                type="button"
                aria-label={`Move ${s.label} right`}
                disabled={i === sizes.length - 1}
                onClick={() => moveSize(i, 1)}
                className="text-muted-foreground hover:text-foreground disabled:opacity-25"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${s.label}`}
                onClick={() => setSizes((list) => list.filter((x) => x.key !== s.key))}
                className="ml-0.5 text-muted-foreground hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>

        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addSizes(newSize.split(","));
            setNewSize("");
          }}
        >
          <input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            placeholder="e.g. M  or  8, 9, 10"
            aria-label="New size"
            className={cn(field, "w-44")}
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1 rounded-pill border border-border px-3 text-sm hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Add size
          </button>
          <span className="mx-1 text-xs text-muted-foreground">or add a set:</span>
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => addSizes(p.sizes)}
              className="inline-flex h-7 items-center rounded-pill border border-border px-2.5 text-xs hover:bg-muted"
            >
              {p.label}
            </button>
          ))}
        </form>
      </div>

      {/* ------------------------------------------------------------ stock */}
      <div className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-sm font-semibold">
            Stock <span className="font-normal text-muted-foreground">· {total} units in total</span>
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={fillValue}
              onChange={(e) => setFillValue(e.target.value)}
              placeholder="Qty"
              aria-label="Set every cell to"
              className={cn(field, "w-20")}
            />
            <button
              type="button"
              onClick={fillAll}
              disabled={fillValue === ""}
              className="inline-flex h-9 items-center rounded-pill border border-border px-3 text-sm hover:bg-muted disabled:opacity-40"
            >
              Set all
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-control border border-border">
          <table className="text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 bg-muted px-3 py-2 text-left font-medium">
                  {colours.length ? "Colour / Size" : ""}
                </th>
                {(sizes.length ? sizes : [{ key: NONE, label: "Stock" }]).map((s) => (
                  <th key={s.key} className="min-w-[4.5rem] px-2 py-2 text-center font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(colours.length ? colours : [{ key: NONE, name: "All", hex: "" }]).map((c) => (
                <tr key={c.key} className="border-t border-border">
                  <th className="sticky left-0 bg-background px-3 py-2 text-left font-normal">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      {c.hex && (
                        <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                      )}
                      {c.name}
                    </span>
                  </th>
                  {colKeys.map((sk) => (
                    <td key={sk} className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={cell(c.key, sk)}
                        aria-label={`Stock for ${c.name}${sk === NONE ? "" : ` size ${sizes.find((s) => s.key === sk)?.label}`}`}
                        onChange={(e) =>
                          setStock((current) => ({
                            ...current,
                            [`${c.key}|${sk}`]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          }))
                        }
                        className={cn(
                          field,
                          "w-16 px-2 py-1.5 text-center",
                          cell(c.key, sk) === 0 && "text-muted-foreground"
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A size or colour that customers have already ordered can&apos;t be removed — set its stock
          to 0 to stop selling it.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="mt-5 inline-flex h-11 items-center rounded-pill bg-primary px-7 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save sizes, colours & stock"}
      </button>
    </section>
  );
}
