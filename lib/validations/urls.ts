import { z } from "zod";

/**
 * URL rules for anything an admin types into the CMS.
 *
 * Images are rendered through next/image, which throws — taking the whole page
 * down with it — for a host that isn't listed in `next.config.ts`. So an image
 * URL is either a path on this site or an https URL on one of those hosts.
 * Keep IMAGE_HOSTS in step with `images.remotePatterns`.
 */
const IMAGE_HOSTS = [/\.supabase\.co$/i, /^res\.cloudinary\.com$/i];

function isSitePath(value: string) {
  // "/x" is a path on this site; "//x" is a protocol-relative URL to anywhere.
  return value.startsWith("/") && !value.startsWith("//");
}

function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

const IMAGE_MESSAGE =
  "Use an uploaded image, a path like /products/photo.webp, or an https URL from Supabase Storage or Cloudinary.";

export const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (isSitePath(value)) return true;
    const url = httpsUrl(value);
    return !!url && IMAGE_HOSTS.some((host) => host.test(url.hostname));
  }, IMAGE_MESSAGE);

/** Optional variant: an empty string means "no image". */
export const optionalImageUrlSchema = z.union([z.literal(""), imageUrlSchema]).optional();

/** Links on buttons and banners: a site path or an https URL, nothing else. */
export const linkUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => isSitePath(value) || httpsUrl(value) !== null,
    "Links must start with / (a page on this site) or https://"
  );

export const optionalLinkUrlSchema = z.union([z.literal(""), linkUrlSchema]).optional();
