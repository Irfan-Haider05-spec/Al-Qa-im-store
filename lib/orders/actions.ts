"use server";

import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";
import { getPaymentProvider } from "@/lib/payments/provider";
import { calculateTotals, validateCoupon } from "@/lib/orders/totals";
import { RULES, clientIp, rateLimit, tooManyMessage } from "@/lib/security/rate-limit";
import type { Prisma } from "@prisma/client";

const GUEST_COOKIE = "se_cart";

// The interactive-transaction client type, exported by the generated Prisma client.
type TxClient = Prisma.TransactionClient;

function genOrderNumber() {
  const d = new Date();
  const stamp =
    d.getFullYear().toString().slice(2) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  // Crypto-random rather than Math.random: order numbers appear in emails and
  // URLs, and a predictable sequence invites guessing other people's orders.
  const rand = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
  return `AQ-${stamp}-${rand}`;
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

  const limited = await rateLimit(`checkout:${await clientIp()}`, RULES.checkout);
  if (!limited.ok) return { ok: false, error: tooManyMessage(limited.retryAfterSec) };

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
    published: boolean;
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
        product: {
          name: string;
          basePrice: unknown;
          salePrice: unknown;
          isPublished: boolean;
        };
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
      published: p.isPublished,
    };
  });

  // A product unpublished (or pulled) after it went into a basket must not be
  // sellable through that basket.
  const withdrawn = priced.find((l) => !l.published);
  if (withdrawn) {
    return {
      ok: false,
      error: `"${withdrawn.productName}" is no longer available. Remove it from your cart to continue.`,
    };
  }

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

  // ---- coupon + money: both worked out here, never taken from the client ----
  let discount = 0;
  let couponId: string | null = null;
  if (data.couponCode) {
    const check = await validateCoupon(data.couponCode, subtotal, user?.id ?? null);
    if (!check.ok) return { ok: false, error: check.error };
    discount = check.discount;
    couponId = check.couponId;
  }

  const { shipping, tax, total } = await calculateTotals(subtotal, discount);

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

      // Recorded for guests as well as signed-in customers — a usage cap that
      // only counts logged-in redemptions is not a cap.
      if (couponId) {
        await tx.couponUsage.create({
          data: { couponId, userId: user?.id ?? null, orderId: order.id },
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
