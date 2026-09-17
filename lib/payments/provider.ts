import type { PaymentMethod, PaymentStatus } from "@prisma/client";

// A replaceable payment provider interface. Checkout depends on THIS,
// not on any concrete provider, so swapping in Stripe later touches only
// this file — never the checkout flow.
export interface PaymentResult {
  status: PaymentStatus;
  provider: string | null;
  providerRef: string | null;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  /** Attempt to take/authorize payment for an order amount. */
  charge(amount: number, meta: { orderNumber: string }): Promise<PaymentResult>;
}

// Cash on Delivery — always the safe default. Nothing is charged online;
// the order is recorded as PENDING payment, collected on delivery.
const codProvider: PaymentProvider = {
  method: "COD",
  async charge() {
    return { status: "PENDING", provider: "cod", providerRef: null };
  },
};

// Resolve a provider by method. Only COD is wired today; card slots in here
// once STRIPE_SECRET_KEY (or another provider) is configured.
export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case "COD":
      return codProvider;
    default:
      // No online provider configured yet — do NOT fake success.
      throw new Error(
        `Payment method "${method}" is not configured. Use COD or configure a provider.`
      );
  }
}
