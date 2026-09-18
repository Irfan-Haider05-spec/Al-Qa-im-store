// Server-side upload to Supabase Storage using the REST API (no extra SDK).
// Requires env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
// The service role key is used server-side ONLY (never exposed to the client).

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

export function isStorageConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function uploadImage(
  file: Blob,
  filename: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) {
    return {
      ok: false,
      error:
        "Image storage isn't configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${new Date().toISOString().slice(0, 7)}/${safe}`;
  const endpoint = `${base}/storage/v1/object/${BUCKET}/${path}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": file.type || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      // Names are unique per upload; never silently replace an existing file.
      "x-upsert": "false",
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Upload failed (${res.status}). ${text.slice(0, 120)}`,
    };
  }

  // Public URL (bucket must be public, or swap for a signed URL).
  const url = `${base}/storage/v1/object/public/${BUCKET}/${path}`;
  return { ok: true, url };
}
