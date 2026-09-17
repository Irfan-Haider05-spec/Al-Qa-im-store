// Generates branded SVG placeholder images for seed products.
// Run once: `node scripts/generate-images.mjs`
// Output: public/products/<slug>-1.svg, -2.svg, -3.svg (gallery of 3 each)
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const OUT = "public/products";
mkdirSync(OUT, { recursive: true });

// brand palette (matches design tokens)
const TEAL = "#0d7f8f";
const TEAL_DEEP = "#0a6a78";
const CORAL = "#e8825f";
const INK = "#12232a";
const PAPER = "#f4f7f8";

// products: slug + display name + category label + accent + a simple glyph type
const PRODUCTS = [
  { slug: "aero-runner-teal", name: "Aero Runner Teal", cat: "Sneakers", accent: TEAL, glyph: "shoe" },
  { slug: "roshe-racer", name: "Roshe Racer", cat: "Sneakers", accent: "#1f3a5f", glyph: "shoe" },
  { slug: "zoom-x-sprint", name: "Zoom-X Sprint", cat: "Sports Shoes", accent: TEAL, glyph: "shoe" },
  { slug: "court-classic-oxford", name: "Court Classic Oxford", cat: "Oxford", accent: "#6b4a2b", glyph: "shoe" },
  { slug: "the-joyride", name: "The Joyride", cat: "Sneakers", accent: CORAL, glyph: "shoe" },
  { slug: "trail-blaze-gtx", name: "Trail Blaze GTX", cat: "Sports Shoes", accent: "#5b6b3a", glyph: "shoe" },
  { slug: "metro-knit-slip", name: "Metro Knit Slip", cat: "Sneakers", accent: "#8a9aa0", glyph: "shoe" },
  { slug: "heritage-derby", name: "Heritage Derby", cat: "Oxford", accent: INK, glyph: "shoe" },
  { slug: "everyday-oxford-shirt", name: "Everyday Oxford Shirt", cat: "Shirts", accent: "#7fb2c9", glyph: "shirt" },
  { slug: "linen-weekend-shirt", name: "Linen Weekend Shirt", cat: "Shirts", accent: "#d8c3a5", glyph: "shirt" },
  { slug: "slim-chino-trousers", name: "Slim Chino Trousers", cat: "Trousers", accent: "#1f3a5f", glyph: "trousers" },
  { slug: "tailored-wool-trousers", name: "Tailored Wool Trousers", cat: "Trousers", accent: "#3a3f44", glyph: "trousers" },
];

// simple line-art glyphs (centered in a 400x400 viewbox area)
function glyphPath(type) {
  if (type === "shirt") {
    return `<path d="M150 150 L200 130 L250 150 L290 175 L270 210 L250 195 L250 300 L150 300 L150 195 L130 210 L110 175 Z"
      fill="white" fill-opacity="0.92" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M180 135 Q200 160 220 135" fill="none" stroke="${INK}" stroke-width="4"/>`;
  }
  if (type === "trousers") {
    return `<path d="M160 130 L240 130 L246 300 L214 300 L200 190 L186 300 L154 300 Z"
      fill="white" fill-opacity="0.92" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <line x1="160" y1="150" x2="240" y2="150" stroke="${INK}" stroke-width="3"/>`;
  }
  // shoe (default) — a stylized side profile
  return `<path d="M120 250 Q120 210 170 205 L230 200 Q270 200 300 235 L320 250 Q325 265 305 270 L140 270 Q118 268 120 250 Z"
    fill="white" fill-opacity="0.92" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M175 208 Q185 225 210 222" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M205 205 Q215 222 240 219" fill="none" stroke="${INK}" stroke-width="3"/>
    <line x1="128" y1="270" x2="312" y2="270" stroke="${INK}" stroke-width="6"/>`;
}

// one image variant; `variant` shifts the background composition slightly
function svg({ name, cat, accent, glyph }, variant) {
  const bgShift = [0, 40, -30][variant] ?? 0;
  const circleR = [220, 180, 260][variant] ?? 220;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PAPER}"/>
      <stop offset="1" stop-color="#e8eef0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="${560 + bgShift}" cy="${240}" r="${circleR}" fill="${accent}" fill-opacity="0.16"/>
  <circle cx="${560 + bgShift}" cy="${240}" r="${circleR * 0.55}" fill="${accent}" fill-opacity="0.28"/>
  <g transform="translate(200,180) scale(1.0)">
    ${glyphPath(glyph)}
  </g>
  <text x="60" y="640" font-family="Arial, sans-serif" font-size="26" fill="${INK}" opacity="0.55" letter-spacing="2">${cat.toUpperCase()}</text>
  <text x="60" y="690" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="48" fill="${INK}">${name}</text>
  <rect x="60" y="710" width="80" height="6" rx="3" fill="${accent}"/>
</svg>`;
}

let count = 0;
for (const p of PRODUCTS) {
  for (let v = 0; v < 3; v++) {
    const file = `${OUT}/${p.slug}-${v + 1}.svg`;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, svg(p, v).trim());
    count++;
  }
}

// hero images (reuse the three most striking products)
mkdirSync("public/hero", { recursive: true });
const heroSlugs = ["aero-runner-teal", "the-joyride", "zoom-x-sprint"];
heroSlugs.forEach((slug, i) => {
  const p = PRODUCTS.find((x) => x.slug === slug);
  writeFileSync(`public/hero/hero-${i + 1}.svg`, svg(p, i).trim());
});

console.log(`Generated ${count} product images + ${heroSlugs.length} hero images.`);
