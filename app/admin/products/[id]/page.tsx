import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductImageManager } from "@/components/admin/product-image-manager";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("products.write");
  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <PageHeader
        title="Edit product"
        description={product.name}
        action={<DeleteProductButton id={product.id} />}
      />
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

      <div className="mt-8 max-w-3xl">
        <ProductImageManager
          productId={product.id}
          images={product.images.map(
            (img: { id: string; url: string; alt: string | null; isPrimary: boolean }) => ({
              id: img.id,
              url: img.url,
              alt: img.alt,
              isPrimary: img.isPrimary,
            })
          )}
        />
      </div>
    </div>
  );
}
