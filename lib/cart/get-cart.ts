import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const GUEST_COOKIE = "se_cart";

export type CartLine = {
  variantId: string;
  quantity: number;
  available: number;
  unitPrice: number;
  lineTotal: number;
  productName: string;
  productSlug: string;
  colorName: string | null;
  sizeLabel: string | null;
  imageUrl: string | null;
};

// Shape of each row from the findMany include below.
type CartItemRow = {
  quantity: number;
  variant: {
    id: string;
    price: unknown;
    salePrice: unknown;
    inventory: { available: number } | null;
    color: { name: string } | null;
    size: { label: string } | null;
    product: {
      name: string;
      slug: string;
      basePrice: unknown;
      salePrice: unknown;
      images: { url: string }[];
    };
  };
};

export async function getCart(): Promise<{
  lines: CartLine[];
  subtotal: number;
  itemCount: number;
}> {
  const user = await getCurrentUser();
  const jar = await cookies();

  const cart = user
    ? await prisma.cart.findUnique({ where: { userId: user.id } })
    : jar.get(GUEST_COOKIE)?.value
      ? await prisma.cart.findUnique({
          where: { guestToken: jar.get(GUEST_COOKIE)!.value },
        })
      : null;

  if (!cart) return { lines: [], subtotal: 0, itemCount: 0 };

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      variant: {
        include: {
          inventory: true,
          color: true,
          size: true,
          product: {
            include: { images: { orderBy: { position: "asc" }, take: 1 } },
          },
        },
      },
    },
  });

  const lines: CartLine[] = items.map((it: CartItemRow) => {
    const v = it.variant;
    const p = v.product;
    // variant price wins, else product sale/base
    const unit =
      v.salePrice != null
        ? Number(v.salePrice)
        : v.price != null
          ? Number(v.price)
          : p.salePrice != null
            ? Number(p.salePrice)
            : Number(p.basePrice);
    return {
      variantId: v.id,
      quantity: it.quantity,
      available: v.inventory?.available ?? 0,
      unitPrice: unit,
      lineTotal: unit * it.quantity,
      productName: p.name,
      productSlug: p.slug,
      colorName: v.color?.name ?? null,
      sizeLabel: v.size?.label ?? null,
      imageUrl: p.images[0]?.url ?? null,
    };
  });

  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  const itemCount = lines.reduce((a, l) => a + l.quantity, 0);

  return { lines, subtotal, itemCount };
}
