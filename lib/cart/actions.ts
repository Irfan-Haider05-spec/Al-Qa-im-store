"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

const GUEST_COOKIE = "se_cart";

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
  if (quantity < 1) return { ok: false, error: "Invalid quantity" };

  // Verify variant + stock server-side — never trust the client.
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { inventory: true },
  });
  if (!variant) return { ok: false, error: "Variant not found" };

  const available = variant.inventory?.available ?? 0;
  const cart = await resolveCart(true);
  if (!cart) return { ok: false, error: "Could not open cart" };

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });
  const desired = (existing?.quantity ?? 0) + quantity;
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

  await prisma.cartItem.update({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    data: { quantity },
  });
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeCartItem(variantId: string) {
  const cart = await resolveCart(false);
  if (!cart) return { ok: false, error: "No cart" };
  await prisma.cartItem
    .delete({ where: { cartId_variantId: { cartId: cart.id, variantId } } })
    .catch(() => {});
  revalidatePath("/cart");
  return { ok: true };
}
