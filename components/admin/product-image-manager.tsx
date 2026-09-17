"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  addProductImage,
  removeProductImage,
  setPrimaryImage,
} from "@/lib/admin/image-actions";

type Img = { id: string; url: string; alt: string | null; isPrimary: boolean };

export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: Img[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newUrl, setNewUrl] = useState("");

  function add() {
    if (!newUrl) return;
    startTransition(async () => {
      await addProductImage({ productId, url: newUrl });
      setNewUrl("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-card border border-border bg-background p-5">
      <h2 className="font-display text-lg font-semibold">Images</h2>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative">
              <div className="relative h-28 w-28 overflow-hidden rounded-control border border-border">
                <Image
                  src={img.url}
                  alt={img.alt ?? ""}
                  fill
                  className="object-cover"
                />
              </div>
              {img.isPrimary && (
                <span className="absolute left-1 top-1 rounded-pill bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                  Primary
                </span>
              )}
              <div className="absolute -right-2 -top-2 flex gap-1">
                {!img.isPrimary && (
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await setPrimaryImage(img.id, productId);
                        router.refresh();
                      })
                    }
                    aria-label="Make primary"
                    className="grid h-6 w-6 place-items-center rounded-full bg-primary text-white"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await removeProductImage(img.id, productId);
                      router.refresh();
                    })
                  }
                  aria-label="Remove image"
                  className="grid h-6 w-6 place-items-center rounded-full bg-danger text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageUpload
        value={newUrl}
        onChange={(url) => {
          // auto-add once uploaded
          if (url && url !== newUrl) {
            setNewUrl(url);
          } else {
            setNewUrl(url);
          }
        }}
        label="Add image"
      />
      <button
        onClick={add}
        disabled={pending || !newUrl}
        className="inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add to gallery"}
      </button>
    </div>
  );
}
