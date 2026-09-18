/**
 * The demo catalogue, kept apart from the seeding logic so the two can be read
 * independently: this file is *what* the store sells, `seed.ts` is *how* it
 * gets into Postgres.
 *
 * Every `slug` here has three photographs waiting in `/public/products` —
 * `<slug>-1.webp` … `-3.webp` — produced by `npm run assets:build` from
 * `scripts/assets.manifest.json`. Add a product here and add its photos there.
 */
import { Gender } from "@prisma/client";

export type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDesc: string;
  /** `/public/categories/<slug>.webp`, or null for a purely virtual category. */
  hasImage?: boolean;
  /** Slug of the department this category sits in. */
  department?: string;
};

/**
 * Top-level departments. Categories sit inside them, and a department's page
 * and filter cover everything in its categories. Clothing starts empty: its
 * categories appear in the shop as soon as the first product is published.
 */
export const DEPARTMENTS: SeedCategory[] = [
  {
    name: "Footwear",
    slug: "footwear",
    description: "Sneakers, performance shoes, leather dress shoes and boots.",
    seoTitle: "Footwear — Sneakers, Dress Shoes & Boots",
    seoDesc: "Shop premium footwear at Al-Qa’im: sneakers, running shoes, leather Oxfords and boots.",
  },
  {
    name: "Clothing",
    slug: "clothing",
    description: "Shirts, trousers and everyday essentials, cut to be worn and kept.",
    seoTitle: "Clothing — Shirts & Trousers",
    seoDesc: "Shop premium shirts and trousers at Al-Qa’im. Cash on delivery.",
  },
];

export type SeedProduct = {
  name: string;
  slug: string;
  categorySlug: string;
  brandSlug: string;
  gender: Gender;
  basePrice: number;
  salePrice?: number;
  shortDesc: string;
  description: string;
  material: string;
  tags: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  /** Per-variant stock, so "low stock" and "sold out" states are real. */
  stock?: { low?: string[]; out?: string[] };
  /** How many photos `/public/products/<slug>-N.webp` holds. Defaults to 3. */
  photos?: number;
  flags?: Partial<{
    isFeatured: boolean;
    isNewArrival: boolean;
    isWeeklyPick: boolean;
    isOnSale: boolean;
  }>;
};

export const CATEGORIES: SeedCategory[] = [
  {
    name: "Sneakers",
    slug: "sneakers",
    description:
      "Everyday silhouettes built for the city — cushioned, breathable and easy to wear with everything.",
    seoTitle: "Men's & Women's Sneakers",
    seoDesc:
      "Shop premium sneakers at Al-Qa’im — cushioned everyday silhouettes in leather, knit and suede.",
    hasImage: true,
    department: "footwear",
  },
  {
    name: "Sports Shoes",
    slug: "sports-shoes",
    description:
      "Performance footwear engineered for tempo runs, gym sessions and race day.",
    seoTitle: "Performance Sports Shoes",
    seoDesc:
      "Running and training shoes built for speed, rebound and lockdown fit. Free delivery over $100.",
    hasImage: true,
    department: "footwear",
  },
  {
    name: "Basketball",
    slug: "basketball",
    description:
      "High-tops and mids with the ankle support and court grip to take contact.",
    seoTitle: "Basketball Shoes",
    seoDesc:
      "Basketball high-tops and mids with responsive cushioning and herringbone court traction.",
    hasImage: true,
    department: "footwear",
  },
  {
    name: "Oxford",
    slug: "oxford",
    description:
      "Leather dress shoes finished the traditional way — for the office, the aisle and everything formal.",
    seoTitle: "Leather Oxford & Derby Shoes",
    seoDesc:
      "Hand-finished leather Oxfords, derbies and brogues with cushioned insoles and welted soles.",
    hasImage: true,
    department: "footwear",
  },
  {
    name: "Boots",
    slug: "boots",
    description:
      "Weatherproof boots with aggressive lugs, built for trails, winter and long days outside.",
    seoTitle: "Waterproof Boots & Hikers",
    seoDesc:
      "Waterproof hiking and lifestyle boots with grippy lug outsoles and full-grain leather uppers.",
    hasImage: true,
    department: "footwear",
  },
  {
    name: "Shirts",
    slug: "shirts",
    description: "Oxford, poplin and linen shirts — pressed for the office, easy at the weekend.",
    seoTitle: "Men's Shirts",
    seoDesc: "Premium cotton and linen shirts at Al-Qa’im. Sizes XS–XXL, cash on delivery.",
    hasImage: true,
    department: "clothing",
  },
  {
    name: "Trousers",
    slug: "trousers",
    description: "Denim, chinos and tailored trousers with a clean, modern cut.",
    seoTitle: "Men's Trousers & Chinos",
    seoDesc: "Chinos and tailored trousers at Al-Qa’im in waist sizes 28–40. Cash on delivery.",
    hasImage: true,
    department: "clothing",
  },
];

export const BRANDS = [
  { name: "Al-Qa’im Studio", slug: "alqaim-studio" },
  { name: "Northline", slug: "northline" },
  { name: "Atelier Rowe", slug: "atelier-rowe" },
];

const SNEAKER_SIZES = ["7", "8", "9", "10", "11", "12"];
const WOMENS_SIZES = ["5", "6", "7", "8", "9", "10"];
const FORMAL_SIZES = ["8", "9", "10", "11", "12"];
const EU_SIZES = ["41", "42", "43", "44"];
const SHIRT_SIZES = ["S", "M", "L", "XL", "XXL"];
const WAIST_SIZES = ["28", "30", "32", "34", "36", "38"];

export const PRODUCTS: SeedProduct[] = [
  /* ------------------------------------------------------------- sneakers -- */
  {
    name: "Court Legend AF",
    slug: "court-legend-af",
    categorySlug: "sneakers",
    brandSlug: "alqaim-studio",
    gender: Gender.UNISEX,
    basePrice: 139,
    shortDesc: "The all-white leather court shoe, refined.",
    description:
      "The court silhouette that never dated, rebuilt on a softer last. Full-grain leather panels sit over a perforated toe box for airflow, and the encapsulated air unit under the heel takes the sting out of concrete. Clean enough for a shirt, tough enough for a weekend.",
    material: "Full-grain leather upper, rubber cupsole, OrthoLite® insole",
    tags: ["leather", "court", "everyday", "classic"],
    colors: [
      { name: "Triple White", hex: "#f2f3f4" },
      { name: "Bone", hex: "#e4ded3" },
    ],
    sizes: SNEAKER_SIZES,
    stock: { low: ["12"], out: ["7"] },
    flags: { isFeatured: true, isNewArrival: true },
  },
  {
    name: "Sunset Racer",
    slug: "sunset-racer",
    categorySlug: "sneakers",
    brandSlug: "alqaim-studio",
    gender: Gender.UNISEX,
    basePrice: 149,
    shortDesc: "Retro running lines in a warm palette.",
    description:
      "A retro runner in faded apricot and cream, with a suede mudguard and a waffle outsole that grips wet pavement. The foam midsole is tuned soft rather than springy — this is a shoe for long days on your feet, not for splits.",
    material: "Suede and mesh upper, EVA midsole, waffle rubber outsole",
    tags: ["retro", "suede", "running", "new"],
    colors: [
      { name: "Apricot", hex: "#e8825f" },
      { name: "Cream", hex: "#efe6d8" },
    ],
    sizes: SNEAKER_SIZES,
    flags: { isNewArrival: true },
  },
  {
    name: "Metro Knit Slip",
    slug: "metro-knit-slip",
    categorySlug: "sneakers",
    brandSlug: "northline",
    gender: Gender.WOMEN,
    basePrice: 99,
    salePrice: 69,
    shortDesc: "Washable knit slip-on for the commute.",
    description:
      "One piece of engineered knit, no seams to rub, and a heel tab you can hook a finger through on the way out the door. Machine washable at 30°, which matters more than any spec sheet when you wear a shoe every day.",
    material: "Recycled engineered knit, foam footbed, rubber outsole",
    tags: ["knit", "slip-on", "washable", "sale"],
    colors: [
      { name: "Fog Grey", hex: "#8a9aa0" },
      { name: "Coral", hex: "#e8825f" },
    ],
    sizes: WOMENS_SIZES,
    stock: { low: ["5"] },
    flags: { isOnSale: true },
  },
  {
    name: "Urban Tread Mid",
    slug: "urban-tread-mid",
    categorySlug: "sneakers",
    brandSlug: "northline",
    gender: Gender.MEN,
    basePrice: 129,
    shortDesc: "Mid-cut nubuck with a winter-ready sole.",
    description:
      "A mid-cut sneaker in tobacco nubuck, padded at the collar and lined with a brushed textile that makes it wearable well past autumn. The siped rubber outsole holds on cold, wet pavement where a flat cupsole would slide.",
    material: "Nubuck leather upper, brushed textile lining, siped rubber outsole",
    tags: ["nubuck", "mid", "winter"],
    colors: [
      { name: "Tobacco", hex: "#9a6b43" },
      { name: "Black", hex: "#1b1b1d" },
    ],
    sizes: SNEAKER_SIZES,
    flags: { isFeatured: true },
  },
  {
    name: "Azure Court Low",
    slug: "azure-court-low",
    categorySlug: "sneakers",
    brandSlug: "alqaim-studio",
    gender: Gender.UNISEX,
    basePrice: 119,
    shortDesc: "Low-profile court shoe with a gum sole.",
    description:
      "Slim, low and deliberately plain. Smooth leather quarters, a stitched swoosh of contrast piping and a gum rubber outsole that wears in rather than out. Sizes run true; go down a half if you like a snug fit.",
    material: "Smooth leather upper, canvas lining, gum rubber outsole",
    tags: ["court", "leather", "gum-sole", "everyday"],
    colors: [
      { name: "White", hex: "#f2f3f4" },
      { name: "Navy", hex: "#1f3a5f" },
    ],
    sizes: SNEAKER_SIZES,
  },
  {
    name: "Noir Elite",
    slug: "noir-elite",
    categorySlug: "sneakers",
    brandSlug: "atelier-rowe",
    gender: Gender.UNISEX,
    basePrice: 159,
    shortDesc: "Blacked-out leather trainer.",
    description:
      "Everything on this shoe is black — upper, lining, laces, sole, even the stitching. It reads as a dress shoe from across a room and as a sneaker up close, which is exactly the point.",
    material: "Tumbled leather upper, leather lining, vulcanised rubber sole",
    tags: ["black", "leather", "minimal", "premium"],
    colors: [{ name: "Jet Black", hex: "#141416" }],
    sizes: SNEAKER_SIZES,
    stock: { low: ["11", "12"] },
    flags: { isFeatured: true },
  },
  {
    name: "The Joyride",
    slug: "the-joyride",
    categorySlug: "sneakers",
    brandSlug: "atelier-rowe",
    gender: Gender.UNISEX,
    basePrice: 390,
    shortDesc: "Bead-cushioned statement sneaker.",
    description:
      "Thousands of loose foam beads sit in sealed pods under the foot and redistribute with every step, so the shoe forms to you rather than the other way round. A limited run, finished by hand, and the most comfortable thing we have ever put our name on.",
    material: "Translucent mesh upper, bead-pod midsole, rubber pods",
    tags: ["premium", "cushioned", "limited", "statement"],
    colors: [
      { name: "Volt", hex: "#c8e02a" },
      { name: "Coral", hex: "#e8825f" },
    ],
    sizes: EU_SIZES,
    stock: { low: ["44"] },
    flags: { isWeeklyPick: true, isFeatured: true },
  },

  /* --------------------------------------------------------- sports shoes -- */
  {
    name: "Aero Runner Pro",
    slug: "aero-runner-pro",
    categorySlug: "sports-shoes",
    brandSlug: "alqaim-studio",
    gender: Gender.MEN,
    basePrice: 159,
    shortDesc: "Daily trainer with a visible air unit.",
    description:
      "The trainer most of our runners reach for on most days. A full-length air unit under a firmer carrier foam gives you rebound without the wobble of a soft max-stack shoe, and the engineered mesh upper dries fast after a wet run.",
    material: "Engineered mesh upper, air-unit midsole, waffle rubber outsole",
    tags: ["running", "daily-trainer", "cushioned", "new"],
    colors: [
      { name: "White / Ember", hex: "#e8825f" },
      { name: "Slate", hex: "#5b7078" },
    ],
    sizes: SNEAKER_SIZES,
    flags: { isNewArrival: true, isFeatured: true },
  },
  {
    name: "Velocity Knit X",
    slug: "velocity-knit-x",
    categorySlug: "sports-shoes",
    brandSlug: "alqaim-studio",
    gender: Gender.UNISEX,
    basePrice: 175,
    shortDesc: "Volt-bright training shoe with a split sole.",
    description:
      "Built for the gym floor rather than the road: a wide, stable forefoot for lifting, a split heel that flexes for lateral work, and a cage of welded knit that locks the midfoot down through burpees and box jumps.",
    material: "Welded knit upper, split-heel EVA midsole, textured rubber outsole",
    tags: ["training", "gym", "knit", "new"],
    colors: [
      { name: "Volt", hex: "#c8e02a" },
      { name: "Black", hex: "#1b1b1d" },
    ],
    sizes: SNEAKER_SIZES,
    flags: { isNewArrival: true },
  },
  {
    name: "Crimson Flash",
    slug: "crimson-flash",
    categorySlug: "sports-shoes",
    brandSlug: "alqaim-studio",
    gender: Gender.MEN,
    basePrice: 169,
    salePrice: 129,
    shortDesc: "Flyknit racer tuned for tempo days.",
    description:
      "A stripped-back racer: 212 grams, a one-piece flyknit bootie and a sole cut with deep flex grooves so the shoe bends where your foot does. Minimal upper, minimal heel drop, no wasted weight.",
    material: "Flyknit bootie upper, injected foam midsole, flex-groove outsole",
    tags: ["racing", "flyknit", "lightweight", "sale"],
    colors: [
      { name: "Crimson", hex: "#b4232a" },
      { name: "Bright Blue", hex: "#1d63b8" },
    ],
    sizes: SNEAKER_SIZES,
    stock: { out: ["9"] },
    flags: { isOnSale: true, isFeatured: true },
  },
  {
    name: "Cloud Nine Runner",
    slug: "cloud-nine-runner",
    categorySlug: "sports-shoes",
    brandSlug: "northline",
    gender: Gender.WOMEN,
    basePrice: 145,
    shortDesc: "Max-cushion recovery shoe.",
    description:
      "A deliberately soft, tall-stacked shoe for easy miles and the day after a long run. The rocker geometry rolls you forward so your calves do less work, and the knit collar sits away from the achilles.",
    material: "Knit upper, super-critical foam midsole, rubber heel pads",
    tags: ["running", "recovery", "max-cushion"],
    colors: [
      { name: "Chalk", hex: "#eceef0" },
      { name: "Teal", hex: "#0d7f8f" },
    ],
    sizes: WOMENS_SIZES,
  },
  {
    name: "Pulse Trainer",
    slug: "pulse-trainer",
    categorySlug: "sports-shoes",
    brandSlug: "northline",
    gender: Gender.WOMEN,
    basePrice: 135,
    salePrice: 109,
    shortDesc: "Studio trainer with a pivot point.",
    description:
      "Made for studio classes — a low-profile sole with a forefoot pivot disc so you can turn without your shoe gripping and your knee taking the load. Light, breathable, and quiet on a wooden floor.",
    material: "Mesh upper, low-profile EVA midsole, pivot rubber outsole",
    tags: ["training", "studio", "lightweight", "sale"],
    colors: [
      { name: "Blush", hex: "#e7b7b0" },
      { name: "White", hex: "#f2f3f4" },
    ],
    sizes: WOMENS_SIZES,
    flags: { isOnSale: true },
  },

  /* ----------------------------------------------------------- basketball -- */
  {
    name: "Blaze High-Top",
    slug: "blaze-high-top",
    categorySlug: "basketball",
    brandSlug: "alqaim-studio",
    gender: Gender.UNISEX,
    basePrice: 185,
    shortDesc: "Ankle-height leather high-top.",
    description:
      "A leather high-top cut above the ankle bone, with a padded collar and a lace loop that pulls the midfoot down hard. Herringbone traction across the full outsole — it stops when you stop.",
    material: "Leather and canvas upper, encapsulated foam midsole, herringbone outsole",
    tags: ["basketball", "high-top", "leather"],
    colors: [
      { name: "Ember / Black", hex: "#d4692f" },
      { name: "University Blue", hex: "#4a8fd4" },
    ],
    sizes: SNEAKER_SIZES,
    flags: { isNewArrival: true },
  },
  {
    name: "Storm Court Mid",
    slug: "storm-court-mid",
    categorySlug: "basketball",
    brandSlug: "alqaim-studio",
    gender: Gender.MEN,
    basePrice: 179,
    shortDesc: "Mid-cut court shoe with a caged midfoot.",
    description:
      "A mid built for guards: low to the floor for court feel, with a TPU cage that wraps the midfoot so hard cuts don't roll you off the footbed. The mesh tongue vents through a full game.",
    material: "Mesh and synthetic upper, TPU midfoot cage, rubber court outsole",
    tags: ["basketball", "mid", "support"],
    colors: [
      { name: "Storm Navy", hex: "#232b3a" },
      { name: "Ember", hex: "#e07b3c" },
    ],
    sizes: SNEAKER_SIZES,
    stock: { low: ["8"] },
  },

  /* --------------------------------------------------------------- oxford -- */
  {
    name: "Heritage Oxford",
    slug: "heritage-oxford",
    categorySlug: "oxford",
    brandSlug: "atelier-rowe",
    gender: Gender.MEN,
    basePrice: 189,
    shortDesc: "Closed-lacing calf leather Oxford.",
    description:
      "A proper Oxford: closed lacing, a clean toe with no broguing, and a leather sole with a rubber top-piece at the heel so it survives pavement. Polished by hand before it leaves us, so it arrives ready to wear.",
    material: "Calf leather upper, leather lining, Blake-stitched leather sole",
    tags: ["formal", "leather", "oxford", "office"],
    colors: [{ name: "Black", hex: "#17181a" }],
    sizes: FORMAL_SIZES,
    stock: { low: ["12"] },
    flags: { isFeatured: true },
  },
  {
    name: "Chestnut Derby",
    slug: "chestnut-derby",
    categorySlug: "oxford",
    brandSlug: "atelier-rowe",
    gender: Gender.MEN,
    basePrice: 199,
    shortDesc: "Open-lacing derby in chestnut calf.",
    description:
      "The open lacing gives you more room over the instep than an Oxford, which makes this the easier shoe to wear all day. Chestnut calf with a hand-burnished toe — the colour deepens with use.",
    material: "Burnished calf leather, leather lining, welted rubber sole",
    tags: ["formal", "leather", "derby"],
    colors: [
      { name: "Chestnut", hex: "#8a4b2a" },
      { name: "Dark Oak", hex: "#5a3a24" },
    ],
    sizes: FORMAL_SIZES,
    flags: { isNewArrival: true },
  },
  {
    name: "Walnut Brogue",
    slug: "walnut-brogue",
    categorySlug: "oxford",
    brandSlug: "atelier-rowe",
    gender: Gender.MEN,
    basePrice: 209,
    salePrice: 169,
    shortDesc: "Full-brogue wingtip in walnut.",
    description:
      "A full brogue — wingtip, medallion, perforation along every seam. Originally punched so water could drain out of a country shoe; now it just looks good with a tweed jacket. Built on a roomy last with a cushioned cork footbed.",
    material: "Walnut calf leather, cork footbed, Goodyear-welted sole",
    tags: ["formal", "brogue", "wingtip", "sale"],
    colors: [{ name: "Walnut", hex: "#6b4a2b" }],
    sizes: FORMAL_SIZES,
    flags: { isOnSale: true },
  },

  /* ---------------------------------------------------------------- boots -- */
  {
    name: "Summit Trail GTX",
    slug: "summit-trail-gtx",
    categorySlug: "boots",
    brandSlug: "northline",
    gender: Gender.UNISEX,
    basePrice: 215,
    shortDesc: "Waterproof hiker with a 5 mm lug.",
    description:
      "A genuinely waterproof boot — a seam-sealed membrane behind a full-grain leather upper, not a spray-on coating. Five-millimetre lugs bite into mud and loose scree, and the shank under the arch keeps the sole from twisting on rock.",
    material: "Full-grain leather, waterproof membrane, 5 mm lug rubber outsole",
    tags: ["hiking", "waterproof", "boots", "outdoor"],
    colors: [
      { name: "Chestnut", hex: "#8a4b2a" },
      { name: "Olive", hex: "#5b6b3a" },
    ],
    sizes: SNEAKER_SIZES,
    flags: { isFeatured: true },
  },
  {
    name: "Ridge Hiker WP",
    slug: "ridge-hiker-wp",
    categorySlug: "boots",
    brandSlug: "northline",
    gender: Gender.MEN,
    basePrice: 195,
    shortDesc: "Mid-weight day-hike boot.",
    description:
      "Lighter and more flexible than a full backpacking boot, so it needs no breaking in, but still cut high enough to keep grit out on a long day. The lace hooks at the top let you loosen the ankle for a descent without redoing the whole boot.",
    material: "Nubuck and textile upper, waterproof membrane, EVA-cushioned lug sole",
    tags: ["hiking", "waterproof", "boots", "lightweight"],
    colors: [{ name: "Granite", hex: "#6a6f73" }],
    sizes: SNEAKER_SIZES,
    stock: { out: ["12"] },
  },

  /* --------------------------------------------------------------- shirts -- */
  {
    name: "Oxford Cotton Shirt",
    slug: "oxford-cotton-shirt",
    categorySlug: "shirts",
    brandSlug: "alqaim-studio",
    gender: Gender.MEN,
    basePrice: 69,
    shortDesc: "Crisp white Oxford, pressed collar.",
    description:
      "The shirt everything else goes with. A two-ply Oxford cotton with a soft hand and just enough structure to hold a collar through a long day, cut close through the body without pulling at the buttons. Wear it pressed with a jacket or open over a tee.",
    material: "100% two-ply Oxford cotton, mother-of-pearl buttons",
    tags: ["shirt", "oxford", "cotton", "office", "white"],
    colors: [
      { name: "White", hex: "#f4f4f2" },
      { name: "Sky Blue", hex: "#bcd3ea" },
      { name: "Pink", hex: "#efc6d3" },
    ],
    sizes: SHIRT_SIZES,
    stock: { low: ["XXL"] },
    flags: { isFeatured: true, isNewArrival: true },
  },
  {
    name: "Plum Poplin Shirt",
    slug: "plum-poplin-shirt",
    categorySlug: "shirts",
    brandSlug: "atelier-rowe",
    gender: Gender.MEN,
    basePrice: 75,
    salePrice: 59,
    shortDesc: "Fine poplin in a deep plum.",
    description:
      "A lightweight poplin with a smooth, cool finish — the dress shirt for warm offices and evening weddings. Plum reads as colour without shouting, and sits as well under navy as it does under grey.",
    material: "100% cotton poplin, 120s two-ply",
    tags: ["shirt", "poplin", "cotton", "summer", "formal"],
    colors: [{ name: "Plum", hex: "#5b2447" }],
    sizes: SHIRT_SIZES,
    stock: { out: ["S"] },
    photos: 2,
    flags: { isNewArrival: true, isOnSale: true },
  },

  /* ------------------------------------------------------------- trousers -- */
  {
    name: "Selvedge Straight Jeans",
    slug: "selvedge-straight-jeans",
    categorySlug: "trousers",
    brandSlug: "northline",
    gender: Gender.MEN,
    basePrice: 110,
    shortDesc: "Raw indigo selvedge, straight leg.",
    description:
      "Fourteen-ounce selvedge denim woven on narrow looms, cut in a straight leg that neither clings nor flares. It starts deep indigo and fades to your own shape over months of wear — the reason people keep jeans like these for years.",
    material: "14 oz cotton selvedge denim, copper rivets",
    tags: ["jeans", "denim", "selvedge", "trousers"],
    colors: [{ name: "Indigo", hex: "#2d3b5c" }],
    sizes: WAIST_SIZES,
    stock: { low: ["38"] },
    flags: { isFeatured: true },
  },
  {
    name: "Washed Black Tapered Jeans",
    slug: "washed-black-tapered-jeans",
    categorySlug: "trousers",
    brandSlug: "alqaim-studio",
    gender: Gender.MEN,
    basePrice: 95,
    shortDesc: "Soft washed black, tapered leg.",
    description:
      "Pre-washed for a lived-in black from day one, with a little stretch through the seat and a taper from the knee so they sit neatly over trainers or boots.",
    material: "98% cotton, 2% elastane stretch denim",
    tags: ["jeans", "denim", "black", "tapered", "trousers"],
    colors: [{ name: "Washed Black", hex: "#2b2b2d" }],
    sizes: WAIST_SIZES,
    photos: 2,
    flags: { isNewArrival: true },
  },
];

/** Hero slides — each points at a real product so the CTA can deep-link. */
export const HERO_SLIDES = [
  { imageUrl: "/hero/hero-1.png", productSlug: "aero-runner-pro" },
  { imageUrl: "/hero/hero-2.png", productSlug: "velocity-knit-x" },
  { imageUrl: "/hero/hero-3.png", productSlug: "noir-elite" },
  { imageUrl: "/hero/hero-4.png", productSlug: "crimson-flash" },
  { imageUrl: "/hero/hero-5.png", productSlug: "sunset-racer" },
];

export const BANNERS = [
  {
    title: "Black Friday — up to 40% off",
    subtitle: "Marked-down styles across every category, while stock lasts.",
    imageUrl: "/banners/promo-primary.webp",
    ctaLabel: "Shop the sale",
    ctaUrl: "/shop?onSale=1",
  },
  {
    title: "The winter boot edit",
    subtitle: "Waterproof, lugged and ready for the worst of it.",
    imageUrl: "/banners/promo-secondary.webp",
    ctaLabel: "Shop boots",
    ctaUrl: "/category/boots",
  },
];
