import { z } from "zod";

// Every field is trimmed and capped: these strings are stored verbatim and shown
// back in the admin, so an unbounded one is a storage and rendering problem.
export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().trim().email("Valid email required").max(254),
  phone: z
    .string()
    .trim()
    .min(6, "Phone is required")
    .max(24)
    .regex(/^[+()\d\s.-]+$/, "Enter a valid phone number"),
  line1: z.string().trim().min(3, "Address is required").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().min(2, "Postal code is required").max(16),
  country: z.string().trim().min(2, "Country is required").max(56),
});

export type AddressInput = z.infer<typeof addressSchema>;

// Saved addresses (account book) don't need an email on the address itself.
export const savedAddressSchema = addressSchema.omit({ email: true });
export type SavedAddressInput = z.infer<typeof savedAddressSchema>;

export const checkoutSchema = addressSchema.extend({
  paymentMethod: z.enum(["COD"]), // extend when a provider is configured
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: z.string().trim().email("Valid email required").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
