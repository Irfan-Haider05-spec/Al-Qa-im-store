"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/admin/category-actions";
import { ImageUpload } from "@/components/admin/image-upload";
import { slugify } from "@/lib/utils/format";
import type { CategoryFormInput } from "@/lib/validations/admin";

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  _count: { products: number };
};

/** Every field the action expects, taken from the stored row. */
function toForm(c: Cat): CategoryFormInput {
  return {
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    imageUrl: c.imageUrl ?? "",
    isActive: c.isActive,
    seoTitle: c.seoTitle ?? "",
    seoDesc: c.seoDesc ?? "",
  };
}

const input =
  "w-full rounded-control border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryFormInput | null>(null);
  const [pending, startTransition] = useTransition();

  function create() {
    setError(null);
    startTransition(async () => {
      const res = await createCategory({
        name,
        slug: slug || slugify(name),
        description: "",
        imageUrl: "",
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
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
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
      <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-background p-4">
        <div>
          <label htmlFor="new-cat-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="new-cat-name"
            className={input}
            value={name}
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
        <button
          type="button"
          onClick={create}
          disabled={pending || !name}
          className="inline-flex h-10 items-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          Add category
        </button>
        <p className="basis-full text-xs text-muted-foreground">
          After adding, use Edit to set the photo shown in the menu and on the homepage.
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
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <Fragment key={c.id}>
                <tr className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-control bg-muted">
                        {c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                          <img src={c.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                        )}
                      </span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3">{c._count.products}</td>
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
                      {c.isActive ? "Active" : "Inactive"}
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
                    <td colSpan={5} className="px-4 py-5">
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
                          <div>
                            <label className="mb-1 block text-sm font-medium">Slug</label>
                            <input
                              className={input}
                              value={draft.slug}
                              onChange={(e) => set("slug", e.target.value)}
                            />
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
