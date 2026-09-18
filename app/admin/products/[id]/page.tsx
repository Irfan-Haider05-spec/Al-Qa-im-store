import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Circle, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { ProductOptionsManager } from "@/components/admin/product-options-manager";
import { getCategoryOptions } from "@/lib/admin/catalog-options";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  await requirePermission("products.write");
  const { id } = await params;
  const { new: justCreated } = await searchParams;

  const current = await prisma.product.findUnique({ where: { id }, select: { categoryId: true } });
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        colors: { orderBy: { name: "asc" } },
        sizes: { orderBy: { position: "asc" } },
        variants: { select: { colorId: true, sizeId: true, inventory: { select: { available: true } } } },
      },
    }),
    getCategoryOptions(current?.categoryId),
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!product) notFound();

  const stock: Record<string, number> = {};
  for (const v of product.variants) {
    stock[`${v.colorId ?? "-"}|${v.sizeId ?? "-"}`] = v.inventory?.available ?? 0;
  }
  const units = product.variants.reduce((n, v) => n + (v.inventory?.available ?? 0), 0);

  // What stands between this product and a customer buying it.
  const checklist = [
    { done: Boolean(product.categoryId), label: "Category chosen" },
    { done: product.images.length > 0, label: "At least one photo" },
    { done: product.variants.length > 0 && units > 0, label: "Sizes/colours with stock" },
    { done: product.isPublished, label: "Published" },
  ];
  const ready = checklist.every((c) => c.done);

  return (
    <div>
      <PageHeader
        title="Edit product"
        description={product.name}
        action={
          <div className="flex items-center gap-3">
            {product.isPublished && (
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                View in store
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
            <DeleteProductButton id={product.id} />
          </div>
        }
      />

      <div
        className={
          ready
            ? "mb-6 max-w-3xl rounded-card border border-success/30 bg-success/5 p-4"
            : "mb-6 max-w-3xl rounded-card border border-gold/50 bg-gold/5 p-4"
        }
      >
        <p className="text-sm font-medium">
          {justCreated
            ? "Product created. Next: add photos and sizes/colours with stock, then tick Published."
            : ready
              ? "This product is live and can be bought."
              : "To sell this product, finish these steps:"}
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-1.5">
              {c.done ? (
                <Check className="h-4 w-4 text-success" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
              <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <ProductForm
        productId={product.id}
        categories={categories}
        brands={brands}
        initial={{
          name: product.name,
          slug: product.slug,
          shortDesc: product.shortDesc ?? "",
          description: product.description ?? "",
          gender: product.gender,
          basePrice: Number(product.basePrice),
          salePrice: product.salePrice != null ? Number(product.salePrice) : null,
          sku: product.sku ?? "",
          categoryId: product.categoryId ?? "",
          brandId: product.brandId ?? "",
          tags: product.tags.join(", "),
          isPublished: product.isPublished,
          isFeatured: product.isFeatured,
          isNewArrival: product.isNewArrival,
          isWeeklyPick: product.isWeeklyPick,
          isOnSale: product.isOnSale,
          seoTitle: product.seoTitle ?? "",
          seoDesc: product.seoDesc ?? "",
        }}
      />

      <div className="mt-8 max-w-3xl space-y-8">
        <ProductImageManager
          productId={product.id}
          images={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
          }))}
        />

        <ProductOptionsManager
          productId={product.id}
          initialColours={product.colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex }))}
          initialSizes={product.sizes.map((s) => ({ id: s.id, label: s.label }))}
          initialStock={stock}
        />
      </div>
    </div>
  );
}
