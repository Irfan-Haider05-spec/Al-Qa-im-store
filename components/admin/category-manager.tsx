"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/admin/category-actions";
import { slugify } from "@/lib/utils/format";

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  _count: { products: number };
};

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function create() {
    setError(null);
    startTransition(async () => {
      const res = await createCategory({
        name,
        slug: slug || slugify(name),
        description: "",
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
    startTransition(async () => {
      await updateCategory(c.id, {
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        isActive: !c.isActive,
        seoTitle: "",
        seoDesc: "",
      });
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  const input =
    "rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="space-y-6">
      {/* create row */}
      <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-background p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            className={input}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Slug</label>
          <input
            className={input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <button
          onClick={create}
          disabled={pending || !name}
          className="inline-flex h-10 items-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
        >
          Add category
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* list */}
      <div className="overflow-x-auto rounded-card border border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3">{c._count.products}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`rounded-pill px-2.5 py-0.5 text-xs ${
                      c.isActive
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => remove(c.id)}
                    aria-label="Delete category"
                    className="text-danger hover:opacity-70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
