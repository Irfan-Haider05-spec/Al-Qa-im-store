/**
 * Builds every photographic asset in /public from scripts/assets.manifest.json.
 *
 *   npm run assets:build          # only fetches what is missing
 *   npm run assets:build -- --force
 *
 * Steps per photo:
 *   1. download once into .cache/photos (git-ignored, so CI re-downloads at most once)
 *   2. product / category / banner shots -> square or wide WebP
 *   3. hero shots -> background keyed out to a transparent, trimmed PNG
 *
 * Photos come from Unsplash under the Unsplash License (free commercial use).
 * Replace the manifest — or drop your own files into /public — to ship real
 * brand photography; no component references a remote URL.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, ".cache", "photos");
const PUBLIC = path.join(ROOT, "public");
const FORCE = process.argv.includes("--force");

const PRODUCT_SIZE = 1200;
const CATEGORY = { width: 800, height: 1000 };
const HERO_SIZE = 1100;

/** Unsplash CDN gives us a resized, quality-capped JPEG straight from the id. */
const sourceUrl = (id, w) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=max&w=${w}&q=85`;

const exists = (p) =>
  access(p).then(
    () => true,
    () => false
  );

async function download(id, width) {
  const file = path.join(CACHE, `${id}-${width}.jpg`);
  if (!FORCE && (await exists(file))) return file;

  const res = await fetch(sourceUrl(id, width), {
    headers: { "user-agent": "shoe-express-asset-pipeline" },
  });
  if (!res.ok) throw new Error(`download ${id}: HTTP ${res.status}`);
  await mkdir(CACHE, { recursive: true });
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

/* ---------------------------------------------------------------- cut-out -- */

/**
 * Marks every small opaque island in `seen` as backdrop, leaving only the
 * subject. `seen[p] === 1` means backdrop, so the islands we label here are the
 * runs of `0` — and the ones far smaller than the biggest get flipped to 1.
 */
function keepLargestIslands(seen, width, height, minRatio = 1 / 12) {
  const label = new Int32Array(width * height).fill(-1);
  const queue = new Int32Array(width * height);
  const sizes = [];

  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || label[start] !== -1) continue;
    const id = sizes.length;
    let head = 0;
    let tail = 0;
    label[start] = id;
    queue[tail++] = start;

    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      const y = (p / width) | 0;
      const visit = (q) => {
        if (seen[q] || label[q] !== -1) return;
        label[q] = id;
        queue[tail++] = q;
      };
      if (x > 0) visit(p - 1);
      if (x < width - 1) visit(p + 1);
      if (y > 0) visit(p - width);
      if (y < height - 1) visit(p + width);
    }
    sizes.push(tail);
  }

  if (sizes.length < 2) return;
  const threshold = Math.max(...sizes) * minRatio;
  for (let p = 0; p < seen.length; p++) {
    if (!seen[p] && sizes[label[p]] < threshold) seen[p] = 1;
  }
}

/**
 * Keys a studio backdrop out of a product shot.
 *
 * Region growing rather than a plain flood fill: a pixel joins the backdrop
 * when it is close to the neighbour it spread from (`localTolerance`) *and*
 * still in the backdrop's broad colour family (`tolerance`). Following the
 * local gradient means soft vignettes and cast shadows get keyed too, while
 * the hard edge of the shoe stops the region dead. Seeding only from the
 * border keeps highlights inside the shoe — laces, a white midsole — opaque
 * even when they match the wall exactly.
 */
export async function cutout(file, tolerance, localTolerance = 10) {
  const { data, info } = await sharp(file)
    .resize(HERO_SIZE, HERO_SIZE, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const rgb = (p) => {
    const i = p * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const distance = (a, b) =>
    Math.max(
      Math.abs(a[0] - b[0]),
      Math.abs(a[1] - b[1]),
      Math.abs(a[2] - b[2])
    );

  // Backdrop colour = median of the four corners, so one odd corner can't skew it.
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ].map(([x, y]) => rgb(y * width + x));
  const backdrop = [0, 1, 2].map((c) => {
    const v = corners.map((p) => p[c]).sort((a, b) => a - b);
    return Math.round((v[1] + v[2]) / 2);
  });

  // Breadth-first region grow from every border pixel. A typed ring buffer
  // keeps this linear — a JS array as a stack thrashes at a million pixels.
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const push = (p) => {
    if (seen[p]) return;
    if (distance(rgb(p), backdrop) > tolerance) return;
    seen[p] = 1;
    queue[tail++] = p;
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (head < tail) {
    const p = queue[head++];
    const colour = rgb(p);
    const x = p % width;
    const y = (p / width) | 0;

    const spread = (q) => {
      if (seen[q]) return;
      const candidate = rgb(q);
      if (distance(candidate, colour) > localTolerance) return;
      if (distance(candidate, backdrop) > tolerance) return;
      seen[q] = 1;
      queue[tail++] = q;
    };

    if (x > 0) spread(p - 1);
    if (x < width - 1) spread(p + 1);
    if (y > 0) spread(p - width);
    if (y < height - 1) spread(p + width);
  }

  const covered = tail / seen.length;
  // A key that eats the whole frame (or almost none of it) means the backdrop
  // was not solid — better to ship the untouched photo than a destroyed one.
  if (covered < 0.12 || covered > 0.95) return null;

  // Drop stray islands the key left behind — a torn scrap of backdrop the
  // region could not reach, or dust on the seamless. Anything smaller than a
  // twelfth of the biggest blob is noise; a pair of shoes that don't touch each
  // other survives, because both halves are comfortably above that line.
  keepLargestIslands(seen, width, height);

  const mask = Buffer.alloc(width * height);
  for (let p = 0; p < seen.length; p++) mask[p] = seen[p] ? 0 : 255;

  // `toColourspace("b-w")` matters: sharp otherwise promotes a 1-channel raw
  // buffer to 3 channels on blur, and the mask would land in the alpha plane
  // one-third scrambled.
  const softMask = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(1.2)
    .toColourspace("b-w")
    .raw()
    .toBuffer();

  for (let p = 0; p < width * height; p++) {
    data[p * channels + 3] = softMask[p];
  }

  return sharp(data, { raw: { width, height, channels } })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 });
}

/* ------------------------------------------------------------------ steps -- */

async function buildProducts(manifest) {
  const dir = path.join(PUBLIC, "products");
  await mkdir(dir, { recursive: true });

  for (const product of manifest.products) {
    for (const [i, photo] of product.photos.entries()) {
      const out = path.join(dir, `${product.slug}-${i + 1}.webp`);
      if (!FORCE && (await exists(out))) continue;
      const src = await download(photo, 1600);
      await sharp(src)
        .resize(PRODUCT_SIZE, PRODUCT_SIZE, { fit: "cover", position: "centre" })
        .webp({ quality: 82 })
        .toFile(out);
      console.log(`  product  ${path.basename(out)}`);
    }
  }
}

async function buildHero(manifest) {
  const dir = path.join(PUBLIC, "hero");
  await mkdir(dir, { recursive: true });

  for (const slide of manifest.hero) {
    const out = path.join(dir, `${slide.name}.png`);
    if (!FORCE && (await exists(out))) continue;

    const src = await download(slide.photo, 1600);
    const keyed = await cutout(src, slide.tolerance ?? 55, slide.localTolerance ?? 10);

    if (keyed) {
      await keyed.toFile(out);
      console.log(`  hero     ${slide.name}.png (background removed)`);
    } else {
      // Honest fallback: keep the photo, just square and soften it, and say so.
      await sharp(src)
        .resize(HERO_SIZE, HERO_SIZE, { fit: "cover" })
        .png()
        .toFile(out);
      console.warn(
        `  hero     ${slide.name}.png — backdrop was not solid enough to key; ` +
          `shipped the full photo. Tune "tolerance" in assets.manifest.json.`
      );
    }
  }
}

async function buildBanners(manifest) {
  const dir = path.join(PUBLIC, "banners");
  await mkdir(dir, { recursive: true });

  for (const banner of manifest.banners) {
    const out = path.join(dir, `${banner.name}.webp`);
    if (!FORCE && (await exists(out))) continue;
    const src = await download(banner.photo, 2000);
    await sharp(src)
      .resize(banner.width, banner.height, { fit: "cover", position: "centre" })
      .webp({ quality: 80 })
      .toFile(out);
    console.log(`  banner   ${banner.name}.webp`);
  }
}

async function buildCategories(manifest) {
  const dir = path.join(PUBLIC, "categories");
  await mkdir(dir, { recursive: true });

  for (const category of manifest.categories) {
    const out = path.join(dir, `${category.slug}.webp`);
    if (!FORCE && (await exists(out))) continue;
    const src = await download(category.photo, 1400);
    await sharp(src)
      .resize(CATEGORY.width, CATEGORY.height, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toFile(out);
    console.log(`  category ${category.slug}.webp`);
  }
}

async function main() {
  const manifest = JSON.parse(
    await readFile(path.join(import.meta.dirname, "assets.manifest.json"), "utf8")
  );

  console.log(FORCE ? "Rebuilding all assets…" : "Building missing assets…");
  await buildProducts(manifest);
  await buildHero(manifest);
  await buildBanners(manifest);
  await buildCategories(manifest);
  console.log("Assets ready.");
}

// Only run the pipeline when invoked as a script, so tooling can import `cutout`.
if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
