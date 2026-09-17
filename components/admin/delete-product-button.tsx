"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/lib/admin/product-actions";

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="inline-flex h-10 items-center gap-2 rounded-pill border border-danger px-4 text-sm text-danger hover:bg-danger/5"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sure?</span>
      <button
        onClick={() =>
          startTransition(async () => {
            await deleteProduct(id);
            router.push("/admin/products");
            router.refresh();
          })
        }
        disabled={pending}
        className="inline-flex h-10 items-center rounded-pill bg-danger px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="inline-flex h-10 items-center rounded-pill border border-border px-4 text-sm hover:bg-muted"
      >
        Cancel
      </button>
    </div>
  );
}
