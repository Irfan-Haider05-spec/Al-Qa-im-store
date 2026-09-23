import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

const GUEST_COOKIE = "se_cart";
const MAX_LINE_QUANTITY = 20;

/**
 * Orders placed before the customer had an account.
 *
 * Checkout now requires signing in, but orders taken while it didn't — and any
 * placed from a different device before signing in — still carry only the email
 * typed at checkout. Matching that email to the account they just signed into
 * puts those orders in "My orders", which is where customers look to track them.
 *
 * Case-insensitive on purpose: "Sam@example.com" at checkout and
 * "sam@example.com" on the account are the same person.
 */
async function claimGuestOrders(userId: string, email: string) {
  const claimed = await prisma.$executeRaw`
    UPDATE "Order"
    SET "userId" = ${userId}
    WHERE "userId" IS NULL
      AND lower("shippingAddress"->>'email') = lower(${email})`;
  if (claimed > 0) {
    console.info(`[auth] attached ${claimed} guest order(s) to ${userId}`);
  }
}

/**
 * Moves a basket built while signed out into the customer's own cart, so
 * signing in at checkout never looks like it emptied the basket.
 *
 * Idempotent: the guest cart is deleted once moved, so running again (or with
 * a cookie the browser still holds) finds nothing to do.
 */
async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const token = jar.get(GUEST_COOKIE)?.value;
  if (!token) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken: token },
    include: { items: { include: { variant: { select: { inventory: true } } } } },
  });

  if (guestCart) {
    const userCart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    for (const item of guestCart.items) {
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      });
      const available = item.variant.inventory?.available ?? 0;
      // Never merge past what is in stock, or past the per-line cap.
      const quantity = Math.min(
        (existing?.quantity ?? 0) + item.quantity,
        available,
        MAX_LINE_QUANTITY
      );
      if (quantity < 1) continue;

      await prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        update: { quantity },
        create: { cartId: userCart.id, variantId: item.variantId, quantity },
      });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
    await prisma.cart.delete({ where: { id: guestCart.id } });
  }

  // The cookie is deliberately left alone. This runs inside Auth.js's sign-in
  // event, which is writing the session cookie onto the same response, and
  // touching cookies from here breaks that write. It costs nothing: the guest
  // cart row is gone, so the stale token resolves to no cart at all.
}

/**
 * Everything that should happen the moment someone signs in, whichever way
 * they did it. Failures are logged, never thrown: a sign-in must not fail
 * because a basket could not be merged.
 */
export async function attachGuestActivity(email?: string | null) {
  if (!email) return;
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true },
    });
    if (!user) return;
    await claimGuestOrders(user.id, user.email);
    await mergeGuestCart(user.id);
  } catch (error) {
    console.error("[auth] could not attach guest orders/cart", error);
  }
}

export { mergeGuestCart };
