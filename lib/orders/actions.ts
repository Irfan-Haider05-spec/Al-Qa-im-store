"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { getPaymentProvider } from "@/lib/payments/provider";
import type { Prisma } from "@prisma/client";

const GUEST_COOKIE = "se_cart";
const FREE_SHIP_THRESHOLD = 100;
const FLAT_SHIP = 5;

// The interactive-transaction client type, exported by the generated Prisma client.
type TxClient = Prisma.TransactionClient;

function genOrderNumber() {
  const d = new Date();
  const stamp =
    d.getFullYear().toString().slice(2) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SE-${stamp}-${rand}`;
}

type OrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

export async function placeOrder(input: CheckoutInput): Promise<OrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const user = await getCurrentUser();
  const jar = await cookies();
  const guestToken = jar.get(GUEST_COOKIE)?.value;

  const cart = user
    ? await prisma.cart.findUnique({ where: { userId: user.id } })
    : guestToken
      ? await prisma.cart.findUnique({ where: { guestToken } })
      : null;

  if (!cart) return { ok: false, error: "Your cart is empty." };

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      variant: {
        include: {
          inventory: true,
          color: true,
          size: true,
          product: true,
        },
      },
    },
  });

  if (items.length === 0) return { ok: false, error: "Your cart is empty." };

  // ---- re-price everything server-side; never trust client amounts ----
  type Priced = {
    variantId: string;
    quantity: number;
    unitPrice: number;
    productName: string;
    variantLabel: string | null;
    available: number;
  };

  const priced: Priced[] = items.map(
    (it: {
      quantity: number;
      variant: {
        id: string;
        price: unknown;
        salePrice: unknown;
        inventory: { available: number } | null;
        color: { name: string } | null;
        size: { label: string } | null;
        product: { name: string; basePrice: unknown; salePrice: unknown };
      };
    }) => {
    const v = it.variant;
    const p = v.product;
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
      unitPrice: unit,
      productName: p.name,
      variantLabel: [v.color?.name, v.size?.label].filter(Boolean).join(" · ") || null,
      available: v.inventory?.available ?? 0,
    };
  });

  // stock check
  for (const line of priced) {
    if (line.quantity > line.available) {
      return {
        ok: false,
        error: `"${line.productName}" only has ${line.available} left.`,
      };
    }
  }

  const subtotal = priced.reduce((a, l) => a + l.unitPrice * l.quantity, 0);

  // ---- coupon (server-validated) ----
  let discount = 0;
  let couponId: string | null = null;
  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode.toUpperCase() },
    });
    const now = new Date();
    const valid =
      coupon &&
      coupon.isActive &&
      (!coupon.expiresAt || coupon.expiresAt > now) &&
      (!coupon.minOrder || subtotal >= Number(coupon.minOrder));
    if (!valid) {
      return { ok: false, error: "Coupon is invalid or expired." };
    }
    couponId = coupon!.id;
    discount =
      coupon!.type === "PERCENT"
        ? (subtotal * Number(coupon!.value)) / 100
        : Number(coupon!.value);
    discount = Math.min(discount, subtotal);
  }

  const shipping =
    subtotal - discount >= FREE_SHIP_THRESHOLD ? 0 : FLAT_SHIP;
  const tax = 0; // configurable in Phase 5 settings
  const total = subtotal - discount + shipping + tax;

  const orderNumber = genOrderNumber();
  const provider = getPaymentProvider(data.paymentMethod);
  const payment = await provider.charge(total, { orderNumber });

  // ---- atomic: decrement stock + create order in one transaction ----
  try {
    await prisma.$transaction(async (tx: TxClient) => {
      // guarded stock decrements (fail if someone else bought in the meantime)
      for (const line of priced) {
        const res = await tx.inventory.updateMany({
          where: {
            variantId: line.variantId,
            available: { gte: line.quantity },
          },
          data: { available: { decrement: line.quantity } },
        });
        if (res.count === 0) {
          throw new Error(`"${line.productName}" just went out of stock.`);
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          status: "PENDING",
          subtotal,
          discount,
          shipping,
          tax,
          total,
          couponId,
          shippingAddress: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            line1: data.line1,
            line2: data.line2 || null,
            city: data.city,
            state: data.state || null,
            postalCode: data.postalCode,
            country: data.country,
          },
          items: {
            create: priced.map((l) => ({
              variantId: l.variantId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              productName: l.productName,
              variantLabel: l.variantLabel,
            })),
          },
          payment: {
            create: {
              method: data.paymentMethod,
              status: payment.status,
              provider: payment.provider,
              providerRef: payment.providerRef,
              amount: total,
            },
          },
        },
      });

      if (couponId && user) {
        await tx.couponUsage.create({
          data: { couponId, userId: user.id },
        });
      }

      // clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not place order.";
    return { ok: false, error: msg };
  }

  revalidatePath("/cart");
  revalidatePath("/account/orders");
  return { ok: true, orderNumber };
}
