"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CornerDownRight, ImageIcon, Pencil, Trash2 } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/admin/category-actions";
import { ImageUpload } from "@/components/admin/image-upload";
import { slugify } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CategoryFormInput } from "@/lib/validations/admin";

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  position: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  _count: { products: number; children: number };
};

/** Every field the action expects, taken from the stored row. */
function toForm(c: Cat): CategoryFormInput {
  return {
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    imageUrl: c.imageUrl ?? "",
    parentId: c.parentId ?? "",
    position: c.position,
    isActive: c.isActive,
    seoTitle: c.seoTitle ?? "",
    seoDesc: c.seoDesc ?? "",
  };
}

const input =
  "w-full rounded-control border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

/**
 * Departments (Footwear, Clothing) and the categories inside them (Sneakers,
 * Shirts). Shoppers see a department in the menu once any product in it is
 * published; empty ones stay out of sight until then.
 */
export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryFormInput | null>(null);
  const [pending, startTransition] = useTransition();

  const departments = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  // Departments in order, each followed by its own categories.
  const rows = useMemo(
    () =>
      departments.flatMap((d) => [
        { cat: d, depth: 0 },
        ...categories.filter((c) => c.parentId === d.id).map((c) => ({ cat: c, depth: 1 })),
      ]),
    [categories, departments]
  );

  function create() {
    setError(null);
    startTransition(async () => {
      const res = await createCategory({
        name,
        slug: slug || slugify(name),
        description: "",
        imageUrl: "",
        parentId,
        position: 0,
        isActive: true,
        seoTitle: "",
        seoDesc: "",
      });
      if (res.ok) {
        setName("");
        setSlug("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function toggleActive(c: Cat) {
    setError(null);
    startTransition(async () => {
      // Sends the full stored record so nothing else is overwritten.
      const res = await updateCategory(c.id, { ...toForm(c), isActive: !c.isActive });
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  function startEdit(c: Cat) {
    setError(null);
    setEditing(c.id);
    setDraft(toForm(c));
  }

  function save(id: string) {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const res = await updateCategory(id, draft);
      if (res.ok) {
        setEditing(null);
        setDraft(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function remove(c: Cat) {
    if (!window.confirm(`Delete "${c.name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteCategory(c.id);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  const set = <K extends keyof CategoryFormInput>(key: K, value: CategoryFormInput[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <div className="space-y-6">
      {/* create row */}
      <div className="rounded-card border border-border bg-background p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="new-cat-name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id="new-cat-name"
              className={input}
              value={name}
              placeholder="e.g. Shirts"
              onChange={(e) => {
                setName(e.target.value);
                setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label htmlFor="new-cat-slug" className="mb-1 block text-sm font-medium">
              Slug
            </label>
            <input
              id="new-cat-slug"
              className={input}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="new-cat-parent" className="mb-1 block text-sm font-medium">
              Inside department
            </label>
            <select
              id="new-cat-parent"
              className={input}
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">— none: this is a new department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={create}
            disabled={pending || !name}
            className="inline-flex h-10 items-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          A <strong className="text-foreground">department</strong> groups related categories —
          e.g. <em>Clothing</em> with <em>Shirts</em> and <em>Trousers</em> inside it. Products
          go into a category; a department&apos;s page shows everything in its categories. New
          categories appear in the shop as soon as one of their products is published. Use the
          pencil to add a photo, description and SEO.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {/* list */}
      <div className="overflow-x-auto rounded-card border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ cat: c, depth }) => (
              <Fragment key={c.id}>
                <tr
                  className={cn(
                    "border-b border-border last:border-0",
                    depth === 0 && "bg-muted/25"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className={cn("flex items-center gap-3", depth === 1 && "pl-6")}>
                      {depth === 1 && (
                        <CornerDownRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-control bg-muted">
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                          <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                        )}
                      </span>
                      <span>
                        <span className="block font-medium">{c.name}</span>
                        {depth === 0 && (
                          <span className="text-xs text-muted-foreground">
                            Department · {c._count.children} categor
                            {c._count.children === 1 ? "y" : "ies"}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3">
                    {depth === 0
                      ? // A department's count includes everything in its categories.
                        c._count.products +
                        categories
                          .filter((child) => child.parentId === c.id)
                          .reduce((sum, child) => sum + child._count.products, 0)
                      : c._count.products}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.position}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(c)}
                      disabled={pending}
                      className={`rounded-pill px-2.5 py-0.5 text-xs ${
                        c.isActive
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.isActive ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => (editing === c.id ? setEditing(null) : startEdit(c))}
                        aria-label={`Edit ${c.name}`}
                        aria-expanded={editing === c.id}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c)}
                        aria-label={`Delete ${c.name}`}
                        className="text-danger hover:opacity-70"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {editing === c.id && draft && (
                  <tr className="border-b border-border bg-muted/30">
                    <td colSpan={6} className="px-4 py-5">
                      <div className="grid gap-5 lg:grid-cols-[auto_1fr_1fr]">
                        <ImageUpload
                          label="Photo"
                          value={draft.imageUrl ?? ""}
                          onChange={(url) => set("imageUrl", url)}
                        />

                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium">Name</label>
                            <input
                              className={input}
                              value={draft.name}
                              onChange={(e) => set("name", e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-[1fr_6rem] gap-3">
                            <div>
                              <label className="mb-1 block text-sm font-medium">Slug</label>
                              <input
                                className={input}
                                value={draft.slug}
                                onChange={(e) => set("slug", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium">Order</label>
                              <input
                                type="number"
                                min={0}
                                className={input}
                                value={draft.position}
                                onChange={(e) => set("position", Number(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Department</label>
                            <select
                              className={input}
                              value={draft.parentId ?? ""}
                              disabled={c._count.children > 0}
                              onChange={(e) => set("parentId", e.target.value)}
                            >
                              <option value="">— none: this is a department —</option>
                              {departments
                                .filter((d) => d.id !== c.id)
                                .map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name}
                                  </option>
                                ))}
                            </select>
                            {c._count.children > 0 && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Departments with categories inside stay at the top level.
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">Description</label>
                            <textarea
                              rows={3}
                              className={input}
                              value={draft.description ?? ""}
                              onChange={(e) => set("description", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium">SEO title</label>
                            <input
                              className={input}
                              value={draft.seoTitle ?? ""}
                              onChange={(e) => set("seoTitle", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium">
                              SEO description
                            </label>
                            <textarea
                              rows={3}
                              className={input}
                              value={draft.seoDesc ?? ""}
                              onChange={(e) => set("seoDesc", e.target.value)}
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={draft.isActive}
                              onChange={(e) => set("isActive", e.target.checked)}
                            />
                            Visible in the store
                          </label>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-3">
                        <button
                          type="button"
                          onClick={() => save(c.id)}
                          disabled={pending}
                          className="inline-flex h-10 items-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
                        >
                          {pending ? "Saving…" : "Save changes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="inline-flex h-10 items-center rounded-pill border border-border px-5 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
