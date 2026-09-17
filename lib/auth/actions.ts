"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validations/checkout";
import { signIn, signOut } from "@/lib/auth/auth";

type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password } = parsed.data;

  // Same case-insensitive rule the sign-in lookup uses, so a second
  // registration with different capitalisation is caught as a duplicate
  // rather than creating a shadow account nobody can log into.
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "CUSTOMER",
    },
  });

  return { ok: true };
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return { ok: true };
  } catch {
    return { ok: false, error: "Invalid email or password." };
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
