import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  shortDesc: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]),
  basePrice: z.coerce.number().positive("Price must be greater than 0"),
  salePrice: z.coerce.number().nonnegative().optional().nullable(),
  sku: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  brandId: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")), // comma-separated in the form
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isWeeklyPick: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDesc: z.string().optional().or(z.literal("")),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDesc: z.string().optional().or(z.literal("")),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
