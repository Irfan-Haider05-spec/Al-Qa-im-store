"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { revalidateStorefront } from "@/lib/cache/storefront";

const optionsSchema = z.object({
  colors: z
    .array(
      z.object({
        id: z.string().max(64).optional(),
        name: z.string().trim().min(1, "Every colour needs a name").max(40),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colours must be a hex value like #1F2A44"),
      })
    )
    .max(30, "Up to 30 colours per product"),
  sizes: z
    .array(
      z.object({
        id: z.string().max(64).optional(),
        label: z.string().trim().min(1, "Every size needs a label").max(20),
      })
    )
    .max(40, "Up to 40 sizes per product"),
  /** stock[colourIndex][sizeIndex]; a single row/column when there are no colours/sizes. */
  stock: z.array(z.array(z.coerce.number().int().min(0).max(100000))),
});

export type ProductOptionsInput = z.infer<typeof optionsSchema>;

const skuPart = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 14);

/**
 * Saves a product's colours, sizes and the stock of every colour × size
 * combination in one go, creating and removing variants to match.
 *
 * A product with no colours or no sizes still gets exactly one variant per
 * remaining option (or a single one when it has neither), which is what makes
 * a one-size item — a belt, a cap — sellable.
 *
 * Variants that customers have already ordered are never deleted: order
 * history points at them. Removing such a colour or size is refused with a
 * clear message; setting its stock to 0 hides it from sale instead.
 */
export async function saveProductOptions(productId: string, input: ProductOptionsInput) {
  const admin = await requirePermission("products.write");
  const parsed = optionsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid options" };
  }
  const { colors, sizes, stock } = parsed.data;

  const dupe = (values: string[]) => {
    const seen = new Set<string>();
    return values.find((v) => {
      const key = v.toLowerCase();
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
  };
  const dupeColour = dupe(colors.map((c) => c.name));
  if (dupeColour) return { ok: false as const, error: `The colour "${dupeColour}" is listed twice.` };
  const dupeSize = dupe(sizes.map((s) => s.label));
  if (dupeSize) return { ok: false as const, error: `The size "${dupeSize}" is listed twice.` };

  const rows = Math.max(colors.length, 1);
  const cols = Math.max(sizes.length, 1);
  if (stock.length !== rows || stock.some((row) => row.length !== cols)) {
    return { ok: false as const, error: "The stock table doesn't match the colours and sizes. Reload and try again." };
  }

  const product = await prisma.product.findUnique({
    where: { id: String(productId) },
    select: {
      id: true,
      slug: true,
      sku: true,
      colors: { select: { id: true, name: true } },
      sizes: { select: { id: true, label: true } },
      variants: {
        select: {
          id: true,
          sku: true,
          colorId: true,
          sizeId: true,
          _count: { select: { orderItems: true } },
        },
      },
    },
  });
  if (!product) return { ok: false as const, error: "Product not found." };

  const ownColour = new Set(product.colors.map((c) => c.id));
  const ownSize = new Set(product.sizes.map((s) => s.id));
  const colourName = new Map(product.colors.map((c) => [c.id, c.name]));
  const sizeLabel = new Map(product.sizes.map((s) => [s.id, s.label]));

  try {
    await prisma.$transaction(
      async (tx) => {
        // 1. Colours and sizes: update the ones we have, create the new ones.
        const colourIds: string[] = [];
        for (const colour of colors) {
          if (colour.id && ownColour.has(colour.id)) {
            await tx.productColor.update({
              where: { id: colour.id },
              data: { name: colour.name, hex: colour.hex },
            });
            colourIds.push(colour.id);
          } else {
            const created = await tx.productColor.create({
              data: { productId: product.id, name: colour.name, hex: colour.hex },
            });
            colourIds.push(created.id);
          }
        }
        const sizeIds: string[] = [];
        for (const [position, size] of sizes.entries()) {
          if (size.id && ownSize.has(size.id)) {
            await tx.productSize.update({
              where: { id: size.id },
              data: { label: size.label, position },
            });
            sizeIds.push(size.id);
          } else {
            const created = await tx.productSize.create({
              data: { productId: product.id, label: size.label, position },
            });
            sizeIds.push(created.id);
          }
        }

        // 2. The combinations that should exist.
        const rowIds: (string | null)[] = colourIds.length ? colourIds : [null];
        const colIds: (string | null)[] = sizeIds.length ? sizeIds : [null];
        const key = (c: string | null, s: string | null) => `${c ?? "-"}|${s ?? "-"}`;
        const wanted = new Set(rowIds.flatMap((c) => colIds.map((s) => key(c, s))));

        // 3. Remove variants that no longer match — unless someone ordered them.
        const blocked: string[] = [];
        for (const variant of product.variants) {
          if (wanted.has(key(variant.colorId, variant.sizeId))) continue;
          if (variant._count.orderItems > 0) {
            blocked.push(
              [colourName.get(variant.colorId ?? ""), sizeLabel.get(variant.sizeId ?? "")]
                .filter(Boolean)
                .join(" / ") || "the default option"
            );
            continue;
          }
          await tx.cartItem.deleteMany({ where: { variantId: variant.id } });
          await tx.productVariant.delete({ where: { id: variant.id } }); // inventory cascades
        }
        if (blocked.length) {
          throw new Error(
            `Customers have already ordered ${blocked.join(", ")}, so it can't be removed. Keep it and set its stock to 0 instead.`
          );
        }

        // 4. Colours and sizes that were taken out.
        const removedColours = product.colors.map((c) => c.id).filter((id) => !colourIds.includes(id));
        const removedSizes = product.sizes.map((s) => s.id).filter((id) => !sizeIds.includes(id));
        if (removedColours.length) {
          await tx.productImage.updateMany({
            where: { colorId: { in: removedColours } },
            data: { colorId: null },
          });
          await tx.productColor.deleteMany({ where: { id: { in: removedColours } } });
        }
        if (removedSizes.length) {
          await tx.productSize.deleteMany({ where: { id: { in: removedSizes } } });
        }

        // 5. Create missing variants and set every stock level.
        const existing = new Map(
          product.variants
            .filter((v) => wanted.has(key(v.colorId, v.sizeId)))
            .map((v) => [key(v.colorId, v.sizeId), v.id])
        );
        const base = skuPart(product.sku || product.slug) || "ITEM";
        const labelFor = new Map<string, string>([
          ...colors.map((c, i) => [colourIds[i], c.name] as [string, string]),
          ...sizes.map((s, i) => [sizeIds[i], s.label] as [string, string]),
        ]);

        for (const [ci, colourId] of rowIds.entries()) {
          for (const [si, sizeId] of colIds.entries()) {
            const available = stock[ci][si];
            const variantId = existing.get(key(colourId, sizeId));
            if (variantId) {
              await tx.inventory.upsert({
                where: { variantId },
                update: { available },
                create: { variantId, available },
              });
              continue;
            }

            let sku = [base, colourId && skuPart(labelFor.get(colourId) ?? ""), sizeId && skuPart(labelFor.get(sizeId) ?? "")]
              .filter(Boolean)
              .join("-");
            if (await tx.productVariant.findUnique({ where: { sku }, select: { id: true } })) {
              sku = `${sku}-${randomBytes(2).toString("hex").toUpperCase()}`;
            }
            await tx.productVariant.create({
              data: {
                productId: product.id,
                colorId: colourId,
                sizeId,
                sku,
                inventory: { create: { available } },
              },
            });
          }
        }
      },
      // Generous: one statement per variant, and the database may be far away.
      { timeout: 60_000, maxWait: 10_000 }
    );
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Could not save the options.",
    };
  }

  await logActivity({
    userId: admin.id,
    action: "product.options_updated",
    entity: "Product",
    entityId: product.id,
    meta: { colours: colors.length, sizes: sizes.length },
  });

  revalidatePath(`/admin/products/${product.id}`);
  revalidatePath("/admin/inventory");
  revalidatePath(`/products/${product.slug}`);
  revalidateStorefront();
  return { ok: true as const };
}
