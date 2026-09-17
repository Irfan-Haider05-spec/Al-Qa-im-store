import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Phone is required"),
  line1: z.string().min(3, "Address is required"),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  state: z.string().optional().or(z.literal("")),
  postalCode: z.string().min(2, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
});

export type AddressInput = z.infer<typeof addressSchema>;

// Saved addresses (account book) don't need an email on the address itself.
export const savedAddressSchema = addressSchema.omit({ email: true });
export type SavedAddressInput = z.infer<typeof savedAddressSchema>;

export const checkoutSchema = addressSchema.extend({
  paymentMethod: z.enum(["COD"]), // extend when a provider is configured
  couponCode: z.string().optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
