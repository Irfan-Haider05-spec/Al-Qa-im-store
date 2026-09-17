"use server";

import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  message: z.string().min(5, "Message is too short"),
});

export async function submitContact(input: {
  name: string;
  email: string;
  message: string;
}) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  await prisma.contactMessage.create({ data: parsed.data });
  return { ok: true };
}
