"use server";

import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { RULES, clientIp, rateLimit, tooManyMessage } from "@/lib/security/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(254),
  message: z
    .string()
    .trim()
    .min(5, "Message is too short")
    .max(5000, "Message is too long (5,000 characters max)"),
});

export async function submitContact(input: {
  name: string;
  email: string;
  message: string;
  /** Honeypot. People never see it; a filled one means a bot. */
  website?: string;
}) {
  // Report success so the bot moves on, and store nothing.
  if (input?.website) return { ok: true };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  // The form is public and writes straight into the admin inbox, so it is the
  // first thing a spam script finds.
  const limited = await rateLimit(`contact:${await clientIp()}`, RULES.contact);
  if (!limited.ok) return { ok: false, error: tooManyMessage(limited.retryAfterSec) };

  await prisma.contactMessage.create({ data: parsed.data });
  return { ok: true };
}
