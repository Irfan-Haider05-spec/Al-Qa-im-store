"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";
import { savedAddressSchema } from "@/lib/validations/checkout";
import { z } from "zod";

export async function addAddress(input: unknown) {
  const user = await requireUser();
  const parsed = savedAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;

  const count = await prisma.address.count({ where: { userId: user.id } });

  await prisma.address.create({
    data: {
      userId: user.id,
      fullName: d.fullName,
      phone: d.phone,
      line1: d.line1,
      line2: d.line2 || null,
      city: d.city,
      state: d.state || null,
      postalCode: d.postalCode,
      country: d.country,
      isDefault: count === 0, // first address becomes default
    },
  });

  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddress(id: string) {
  const user = await requireUser();
  // ownership-scoped delete
  await prisma.address.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/account/addresses");
  return { ok: true };
}

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
});

export async function updateProfile(input: { name: string }) {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });
  revalidatePath("/account/profile");
  return { ok: true };
}

const passwordSchema = z.object({
  // Optional only for accounts that have no password yet (Google sign-in):
  // there is nothing to confirm, and the session already proves who they are.
  current: z.string().max(128).optional().or(z.literal("")),
  next: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password must be at most 128 characters"),
});

export async function changePassword(input: {
  current?: string;
  next: string;
}) {
  const sessionUser = await requireUser();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
  });
  if (!dbUser) return { ok: false, error: "User not found" };

  if (dbUser.passwordHash) {
    if (!parsed.data.current) {
      return { ok: false, error: "Enter your current password." };
    }
    const ok = await bcrypt.compare(parsed.data.current, dbUser.passwordHash);
    if (!ok) return { ok: false, error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.next, 12) },
  });
  revalidatePath("/account/profile");
  return { ok: true };
}
