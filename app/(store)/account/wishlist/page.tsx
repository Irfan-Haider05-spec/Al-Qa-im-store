import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { ProductCard, type CardProduct } from "@/components/product/product-card";
import { productCardInclude } from "@/lib/products/queries";

export default async function WishlistPage() {
  const user = await requireUser();

  const wl = await prisma.wishlist.findUnique({
    where: { userId: user.id },
    include: { items: true },
  });

  const productIds = wl?.items.map((i: { productId: string }) => i.productId) ?? [];
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, isPublished: true },
          include: productCardInclude,
        })
      : [];

  if (products.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-12 text-center">
        <p className="font-medium">Your wishlist is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-deep"
        >
          Discover the collection
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold">Wishlist</h2>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {(products as unknown as CardProduct[]).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
