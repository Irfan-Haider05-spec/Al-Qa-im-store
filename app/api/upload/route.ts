import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { uploadImage, isStorageConfigured } from "@/lib/storage/supabase";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Identify the image from its first bytes instead of trusting the browser.
 *
 * `File.type` is whatever the client says it is, so an HTML or SVG file renamed
 * to .jpg would sail through a MIME check and then be served from the storage
 * bucket as the type we stored. Sniffing the signature, and storing under the
 * sniffed type and extension, closes that off.
 */
function sniffImage(bytes: Uint8Array): { mime: string; ext: string } | null {
  const at = (i: number) => bytes[i] ?? -1;
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...Array.from(bytes.subarray(from, to)));

  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47 &&
    at(4) === 0x0d && at(5) === 0x0a && at(6) === 0x1a && at(7) === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) {
    return { mime: "image/avif", ext: "avif" };
  }
  return null;
}

export async function POST(req: Request) {
  // Uploading is part of editing products, banners or settings.
  const user = await getCurrentUser();
  if (
    !user ||
    !(can(user.role, "products.write") ||
      can(user.role, "homepage.write") ||
      can(user.role, "settings.write"))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Image storage isn't configured yet." },
      { status: 501 }
    );
  }

  // Reject oversized bodies before buffering them, when the client says so.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported file. Upload a JPG, PNG, WebP or AVIF image." },
      { status: 400 }
    );
  }

  // The name is ours, not the uploader's: a random id plus the sniffed
  // extension, with a readable slug kept only for people browsing the bucket.
  const hint = String(form.get("filename") ?? "image")
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "image";
  const name = `${hint}-${randomUUID().slice(0, 8)}.${kind.ext}`;

  const result = await uploadImage(new Blob([bytes], { type: kind.mime }), name);
  if (!result.ok) {
    console.error("[upload]", result.error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ url: result.url });
}
