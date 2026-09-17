import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/permissions";
import { uploadImage, isStorageConfigured } from "@/lib/storage/supabase";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: Request) {
  // Only admin-area roles may upload.
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Image storage isn't configured yet." },
      { status: 501 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported type. Use JPG, PNG, WebP or AVIF." },
      { status: 400 }
    );
  }

  const name = (form.get("filename") as string) || "upload";
  const result = await uploadImage(file, name);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ url: result.url });
}
