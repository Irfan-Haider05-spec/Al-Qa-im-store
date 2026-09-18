import { z } from "zod";
import { optionalImageUrlSchema } from "@/lib/validations/urls";

export const productFormSchema = z
  .object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  shortDesc: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(10000).optional().or(z.literal("")),
  gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]),
  basePrice: z.coerce
    .number()
    .positive("Price must be greater than 0")
    .max(1_000_000, "Price looks too high"),
  salePrice: z.coerce.number().nonnegative().optional().nullable(),
  sku: z.string().trim().max(64).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  brandId: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")), // comma-separated in the form
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isWeeklyPick: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  seoTitle: z.string().max(120).optional().or(z.literal("")),
  seoDesc: z.string().max(320).optional().or(z.literal("")),
  })
  // A "sale" price at or above the regular price would show a nonsense
  // strike-through and a negative saving.
  .refine((d) => d.salePrice == null || d.salePrice === 0 || d.salePrice < d.basePrice, {
    message: "Sale price must be lower than the regular price.",
    path: ["salePrice"],
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  description: z.string().max(1000).optional().or(z.literal("")),
  imageUrl: optionalImageUrlSchema,
  /** Empty for a department (top level); a department's id for a category inside it. */
  parentId: z.string().max(64).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().max(120).optional().or(z.literal("")),
  seoDesc: z.string().max(320).optional().or(z.literal("")),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const brandFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
  logoUrl: optionalImageUrlSchema,
  isActive: z.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export type BrandFormInput = z.infer<typeof brandFormSchema>;
