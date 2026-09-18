"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const GUEST_COOKIE = "se_cart";
const MAX_LINE_QUANTITY = 20;

/** Server actions are public endpoints: arguments arrive as whatever was sent. */
function validQuantity(q: unknown): q is number {
  return typeof q === "number" && Number.isInteger(q) && q >= 0 && q <= MAX_LINE_QUANTITY;
}
function validId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 64;
}

// Resolve (or create) the caller's cart — DB-backed for users, cookie token for guests.
async function resolveCart(createIfMissing = true) {
  const user = await getCurrentUser();
  const jar = await cookies();

  if (user) {
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart && createIfMissing) {
      cart = await prisma.cart.create({ data: { userId: user.id } });
    }
    return cart;
  }

  let token = jar.get(GUEST_COOKIE)?.value;
  if (!token) {
    if (!createIfMissing) return null;
    token = randomUUID();
    jar.set(GUEST_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  let cart = await prisma.cart.findUnique({ where: { guestToken: token } });
  if (!cart && createIfMissing) {
    cart = await prisma.cart.create({ data: { guestToken: token } });
  }
  return cart;
}

export async function addToCart(variantId: string, quantity = 1) {
  if (!validId(variantId) || !validQuantity(quantity) || quantity < 1) {
    return { ok: false, error: "Invalid quantity" };
  }

  // Verify variant + stock server-side — never trust the client.
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true, product: { select: { isPublished: true } } },
  });
  if (!variant || !variant.product.isPublished) {
    return { ok: false, error: "This item is no longer available." };
  }

  const available = variant.inventory?.available ?? 0;
  const cart = await resolveCart(true);
  if (!cart) return { ok: false, error: "Could not open cart" };

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });
  const desired = (existing?.quantity ?? 0) + quantity;
  if (desired > MAX_LINE_QUANTITY) {
    return { ok: false, error: `You can order up to ${MAX_LINE_QUANTITY} of one item.` };
  }
  if (desired > available) {
    return { ok: false, error: `Only ${available} in stock` };
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: desired },
    create: { cartId: cart.id, variantId, quantity },
  });

  revalidatePath("/cart");
  return { ok: true };
}

export async function updateCartItem(variantId: string, quantity: number) {
  if (!validId(variantId) || !validQuantity(quantity)) {
    return { ok: false, error: "Invalid quantity" };
  }
  const cart = await resolveCart(false);
  if (!cart) return { ok: false, error: "No cart" };

  if (quantity < 1) {
    await prisma.cartItem
      .delete({ where: { cartId_variantId: { cartId: cart.id, variantId } } })
      .catch(() => {});
    revalidatePath("/cart");
    return { ok: true };
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true },
  });
  const available = variant?.inventory?.available ?? 0;
  if (quantity > available) {
    return { ok: false, error: `Only ${available} in stock` };
  }

  // updateMany, so a line removed in another tab is a no-op, not a crash.
  await prisma.cartItem.updateMany({
    where: { cartId: cart.id, variantId },
    data: { quantity },
  });
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeCartItem(variantId: string) {
  if (!validId(variantId)) return { ok: false, error: "Invalid item" };
  const cart = await resolveCart(false);
  if (!cart) return { ok: false, error: "No cart" };
  await prisma.cartItem
    .delete({ where: { cartId_variantId: { cartId: cart.id, variantId } } })
    .catch(() => {});
  revalidatePath("/cart");
  return { ok: true };
}
