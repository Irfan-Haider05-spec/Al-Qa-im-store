# Shoe Express — Phase 3 Foundation

A production-ready Next.js (App Router) + PostgreSQL/Prisma e-commerce foundation.
This is the runnable skeleton: design tokens, database schema, authentication,
RBAC, base UI, header, footer, and a CMS-driven homepage hero.

## What's in this phase

- **Next.js 15 + React 19 + TypeScript (strict)** with the `@/*` path alias
- **Tailwind** wired to the design tokens from the architecture blueprint
- **Prisma schema** — all 27 models / 6 enums, variant-aware inventory, CMS models
- **Auth.js (NextAuth v5)** credentials auth + JWT sessions
- **RBAC** — role → permission map with a server-side `can()` gate
- **Middleware** guarding `/admin` and `/account`
- **Base UI** — Button, Badge, Container
- **Layout** — Oswald (display) + Inter (body), header with mobile drawer, orange footer
- **Homepage** hero reading from the `Homepage` CMS row (with a safe fallback)
- **Seed script** — admin user, site settings, homepage content, categories, a sample product with variants + inventory

Later phases add the storefront pages, admin CMS, payments, email, and polish.

---

## 1. Prerequisites

- Node.js 18.18+ (20 or 22 recommended)
- A Supabase project (you already have an account)

## 2. Install

```bash
npm install
```

> `postinstall` runs `prisma generate` automatically.

## 3. Get your Supabase connection strings

In the Supabase dashboard:

1. Open your (new) project for Shoe Express.
2. Click **Connect** in the top bar → **ORMs** → **Prisma**.
3. Copy the two strings it shows:
   - **`DATABASE_URL`** — the *Transaction pooler* URL (port **6543**, has `?pgbouncer=true`). Used at runtime.
   - **`DIRECT_URL`** — the *Direct connection* URL (port **5432**). Used only for migrations.

> Both belong to the same database — they differ only in port/pooling. The dual-URL
> setup is required so migrations bypass the connection pooler.

## 4. Configure environment

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL` and `DIRECT_URL` — from step 3
- `AUTH_SECRET` — generate one:
  ```bash
  npx auth secret        # writes it for you, or:
  openssl rand -base64 32
  ```
- Leave the image/payment/email placeholders commented out for now.

## 5. Create the database tables

For the first setup, push the schema straight to Supabase:

```bash
npm run db:push
```

Or, to track migrations properly (recommended once you're past setup):

```bash
npm run db:migrate      # prisma migrate dev
```

## 6. Seed initial data

```bash
npm run db:seed
```

This creates:

- an admin — `admin@shoeexpress.test` / `changeme123` (override via `SEED_ADMIN_*` in `.env`)
- site settings, homepage CMS content, four categories, one sample product with variants + inventory

**Change the admin password after first login.**

## 7. Run

```bash
npm run dev
```

Open http://localhost:3000 — the hero renders from the seeded `Homepage` row.

---

## Scripts

| Script            | Does                                    |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Start dev server                        |
| `npm run build`   | `prisma generate` + `next build`        |
| `npm run start`   | Start production server                 |
| `npm run db:push` | Push schema to DB (no migration files)  |
| `npm run db:migrate` | Create + apply a migration           |
| `npm run db:seed` | Seed initial data                       |
| `npm run db:studio` | Open Prisma Studio                    |

## Project structure

```
app/
  (store)/        storefront route group (header + footer layout)
    page.tsx      homepage hero (CMS-driven)
  admin/          protected admin area (built out in Phase 5)
  api/auth/       Auth.js route handler
components/
  ui/             Button, Badge, Container
  layout/         Header (+ mobile drawer), Footer
lib/
  auth/           Auth.js config, permissions (RBAC), session helpers
  db/             Prisma client singleton
  utils/          cn(), formatPrice(), slugify()
prisma/
  schema.prisma   full data model
  seed.ts         initial data
middleware.ts     edge guard for /admin and /account
```

## Notes

- **Money** is stored as `Decimal`, never float.
- **Authorization** is enforced server-side (`can()` / `requirePermission()`), not
  by hiding buttons.
- **Homepage** falls back to sensible defaults if the DB isn't seeded yet, so the
  app renders on first boot.

## Next: Phase 4 — Storefront

Shop page + filters, product detail + variant selection, cart, checkout (COD),
and the customer account area.

---

## Phase 4 (part 1) — Storefront catalog

Added in this phase:

- **Shop page** (`/shop`) — real DB-backed filters (category, gender, price, sale),
  sorting (featured / newest / price / rating), pagination. All filter state lives
  in URL query params, so results are shareable and SEO-friendly.
- **Category pages** (`/category/[slug]`) — pre-filtered listings with SEO metadata.
- **Product detail** (`/products/[slug]`) — image gallery + thumbnails, colour/size
  variant selection that maps to a real variant and shows live stock, quantity,
  add-to-cart, description, specs, reviews, related products, canonical + OG
  metadata, and **Product JSON-LD** (rating only shown when real reviews exist).
- **Cart** (`/cart`) — server-action backed, variant-aware, stock-checked on the
  server. DB-backed cart for logged-in users, secure httpOnly cookie token for
  guests. Quantity update / remove with live totals and a free-shipping nudge.
- **Homepage** — now renders Popular Right Now (category pills), New Arrivals from
  the DB, and the membership CTA.
- **Expanded seed** — 8 products across 4 categories, each with colour × size
  variants + inventory, plus a demo customer (`customer@shoeexpress.test` /
  `customer123`).

### Try it after seeding

```bash
npm run db:seed
npm run dev
```

Then: browse `/shop`, filter by category, open a product, pick a size, add to cart,
and visit `/cart`.

> Product images aren't seeded yet (they arrive with admin image upload in Phase 5).
> Cards and galleries show a graceful "No image" placeholder until then.

### Still to come in Phase 4 (part 2)

Checkout (COD) with order creation in a DB transaction + inventory decrement, and
the customer account area (orders, wishlist, addresses, profile).

---

## Phase 4 (part 2) — Checkout, orders & account

Added in this phase:

- **Checkout** (`/checkout`) — shipping form (Zod-validated), order summary, COD
  payment. Order creation runs in a **single DB transaction**: prices are
  recomputed server-side (client amounts are never trusted), stock is re-checked,
  inventory is decremented with a guarded `updateMany` (fails safely if an item
  sold out mid-checkout), the order + items + payment are created, coupon usage is
  recorded, and the cart is cleared — all atomically.
- **Payment abstraction** (`lib/payments/provider.ts`) — checkout depends on a
  `PaymentProvider` interface, not a concrete provider. COD is the wired default;
  a card provider slots in here later without touching checkout. Unconfigured
  methods **throw** rather than fake success.
- **Order confirmation** (`/checkout/success`).
- **Auth pages** — `/login` and `/register` with server actions (register hashes
  the password, auto-logs in, and creates a CUSTOMER).
- **Account area** (`/account`) — overview with stats + recent orders; orders list;
  order detail (with an **ownership/IDOR guard**); wishlist; address book
  (add/delete, first address auto-default); profile (update name, change password
  with current-password verification).
- **SEO** — dynamic `sitemap.xml` (built from published products + active
  categories) and `robots.txt` (disallows `/admin`, `/account`, `/cart`,
  `/checkout`, `/api`).
- **Header** now shows a live cart count.

### End-to-end test after seeding

```bash
npm run db:seed
npm run dev
```

1. Register at `/register` (or log in as `customer@shoeexpress.test` / `customer123`).
2. Add a product to cart, go to `/checkout`, fill the form, place the order (COD).
3. See the confirmation, then `/account/orders` → open the order.
4. Check that the product's stock dropped by the ordered quantity (Prisma Studio or the PDP).

### Security properties in this phase

- Order totals, discounts, and stock are **always** recomputed server-side.
- Inventory decrement is transactional and guarded against overselling.
- Order detail enforces ownership (a user cannot view another user's order).
- Coupons are validated server-side (active, not expired, min-order met).

## Next: Phase 5 — Admin CMS

Dashboard, product/category/inventory CRUD, order management (status + tracking),
reviews moderation, coupons, homepage CMS, banners, SEO settings, image upload,
and the activity log.

---

## Phase 5 (part 1) — Admin CMS: operational core

Added in this phase:

- **Admin shell** (`/admin`) — separate layout (outside the storefront group, so no
  store header/footer), dark sidebar with all sections, top bar with role badge and
  logout. Role-guarded by `requireAdmin()` plus per-action `requirePermission()`.
- **Dashboard** (`/admin/dashboard`) — real metrics from the DB: revenue (excludes
  cancelled/refunded), orders, pending, customers, products, recent orders, top
  products (grouped from order items), and low-stock list. No hardcoded numbers.
- **Products** — full CRUD: list with search, create, edit, publish/unpublish,
  delete (with confirm). Slug uniqueness enforced. Every write is permission-checked
  and written to the activity log. Editing a product's price/flags updates the
  storefront (via `revalidatePath`).
- **Categories** (`/admin/categories`) — inline create, activate/deactivate, delete
  (blocked if the category still has products).
- **Inventory** (`/admin/inventory`) — per-variant editable stock with in/low/out
  status badges; saves via a permission-checked action.
- **Orders** — list with status filter tabs; detail page with items, totals,
  customer + shipping address, and controls to change status, set tracking, and add
  internal notes. **Status changes are transactional**: moving an order to
  Cancelled/Refunded returns stock; moving back out takes it again; refunds sync the
  payment record.
- **Customers** (`/admin/customers`) — read-only list with order count and lifetime
  value.

### Admin ↔ storefront wiring (the mandatory requirement)

- Edit a product's price in admin → storefront reflects it (revalidation).
- Set `New Arrival` / `Weekly Pick` flags → drives the homepage sections.
- Update inventory → PDP stock and checkout availability change.
- Change order status → customer sees it in their account.

### Access

Log in as the seeded admin (`admin@shoeexpress.test` / `changeme123`) and go to
`/admin`. A CUSTOMER role is redirected away by middleware.

### Permissions in play

- `products.read/write/delete`, `orders.read/write`, `customers.read` are enforced
  server-side in every action — hiding a sidebar link is never the security boundary.

## Next: Phase 5 (part 2)

Reviews moderation, coupons CRUD, homepage CMS editor, banners, SEO settings,
site settings, image upload (Supabase Storage), and the activity-log viewer.

---

## Phase 5 (part 2) — Admin CMS: content, config & media

Added in this phase:

- **Reviews moderation** (`/admin/reviews`) — approve / unapprove / delete, with
  All/Pending/Approved tabs. Approving a review makes it (and its rating) appear on
  the product page.
- **Coupons** (`/admin/coupons`) — create percent/fixed coupons with min-order,
  usage limit, per-user limit, and expiry; toggle active; delete. (Server-side
  validation at checkout was already wired in Phase 4.)
- **Homepage CMS** (`/admin/homepage`) — edit hero, weekly-pick (with product
  picker), and membership CTA. Saving updates the live storefront.
- **Banners** (`/admin/banners`) — create with image upload, schedule (start/end),
  toggle active, delete.
- **SEO** (`/admin/seo`) — per-page (home/shop/about/contact) title, description,
  OG image.
- **Settings** (`/admin/settings`) — store name, contact, currency, shipping/tax,
  social links.
- **Users** (`/admin/users`) — change roles, with a guard against demoting the last
  super admin.
- **Activity log** (`/admin/activity`) — last 100 admin actions with who/what/when.
- **Image upload** — `POST /api/upload` (admin-guarded, 5MB limit, image types only)
  → Supabase Storage. Reusable `ImageUpload` component with a URL-paste fallback.
  Product edit page now has a full image gallery manager (add, remove, set primary).

### Supabase Storage setup (for image upload)

1. Supabase dashboard → **Storage** → **New bucket** → name it `product-images`,
   mark it **Public**.
2. In `.env` set:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role` secret
     (server-only; never exposed to the browser)
   - `SUPABASE_STORAGE_BUCKET` — `product-images`
3. Restart `npm run dev`. Until this is set, upload returns a clear "not configured"
   message and you can still paste image URLs directly.

### The admin now fully controls the storefront

Products, prices, inventory, categories, hero, weekly pick, banners, coupons,
reviews, SEO and settings are all DB/CMS-driven. Editing any of them in `/admin`
updates the public site.

## Next: Phase 6 — Polish

Hero product animation (Framer Motion, reduced-motion aware), page/route
transitions, product-card and filter animations, responsive passes, accessibility
sweep, loading/error/empty states, and performance.

---

## Phase 6 & 7 — Polish + Production readiness

### Polish (Phase 6)
- **Hero animation** — `HeroCycler` cross-fades hero product images with a premium
  ease; respects `prefers-reduced-motion` (static fallback) and works with 0/1/many
  images. Hero images are managed from Admin → Homepage (hero slides).
- **Scroll-in animations** — `FadeIn` wraps homepage sections; reduced-motion safe.
- **Loading states** — route-level skeletons for shop and product pages; global,
  admin loading spinners; reusable `Skeleton` / `ProductCardSkeleton`.
- **Error & not-found** — branded global `not-found`, global `error` boundary, and
  admin `error` boundary.
- **Empty states** — cart, wishlist, orders, shop no-results, admin tables.
- **Accessibility** — skip-to-content link, `<main>` landmark, focus-visible rings,
  aria labels on icon buttons, keyboard-friendly controls, alt text on images,
  global reduced-motion handling.
- **New pages** — `/contact` (stores messages) and `/about`.

### Production readiness (Phase 7)
- **Security headers** in `next.config.ts` (HSTS, X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy); `poweredByHeader` off.
- **Auth** `trustHost: true` for platform deploys.
- **Health check** — `/api/health` returns DB status for uptime monitors.
- **Image optimization** — AVIF/WebP formats, remote patterns locked down.
- **Seed** now includes hero-ready content, sample approved reviews (so ratings
  render), and a `WELCOME20` coupon.
- **Docs** — `DEPLOYMENT.md` (Vercel + Supabase, step by step) and `TESTING.md`
  (full manual QA checklist).

### Verification status
- `tsc --noEmit`: **0 errors** (strict mode)
- `next lint`: **0 warnings/errors** (core-web-vitals ruleset)
- Final `npm run build` must be run on your machine/CI — Prisma downloads its query
  engine at generate time, which a restricted sandbox can't fetch. See DEPLOYMENT.md
  §1; on any normal environment `npm run build` completes the verification.

### Go-live in three commands (after filling `.env`)
```bash
npm install
npm run build      # verifies the production build
npm run db:push && npm run db:seed   # first-time DB setup
```
Then deploy to Vercel per **DEPLOYMENT.md**.

---

## Selling anything, not just shoes

The store is product-type agnostic. Nav categories, footer, and store name are all
**pulled from the database**, so adding a new product type (trousers, shirts,
jackets…) needs **no code changes** — just admin actions:

1. **Admin → Categories** → add the category (e.g. "Shirts", "Trousers").
   It appears in the header drawer, footer, and homepage pills automatically.
2. **Admin → Products → New** → create the product, pick the new category, set
   sizes in whatever scheme fits (`S/M/L/XL` for shirts, `30/32/34` for trousers,
   `8/9/10` for shoes), add colours, prices, and flags.
3. **Admin → product → Images** → upload photos.
4. **SEO is automatic** — every published product gets canonical + OpenGraph tags,
   Product JSON-LD, and an entry in `/sitemap.xml`. Per-product SEO title/description
   can be overridden on the product form; per-category SEO on the category.
5. Publish → it's live, searchable, filterable, and in the sitemap.

Sizes are free-text labels per product, so any sizing scheme works without a schema
change. Attributes like material or fit can go in the product **tags** (already
searchable). If you later want dedicated material/fit filters, that's a small
additive `ProductAttribute` model — ask when you need it.

To rebrand from "Shoe Express" to a general store name, set it in
**Admin → Settings → Store name** (drives the header wordmark and footer) — no code
change. The seed's default text is just a starting point.

---

## Dummy images (and replacing them with real photos)

The seed ships **branded placeholder images** so the store looks complete out of the
box — every product has a 3-image gallery, and the hero has 3 slides. These are
clean SVGs in `public/products/`, `public/hero/` (generated by
`scripts/generate-images.mjs`, re-runnable via `npm run gen:images`). They're
self-contained — no external URLs that can break.

They render with a product glyph (shoe / shirt / trousers), the category label, and
the product name on the brand palette.

### Replace with your real photos — two easy ways

**Per product (recommended, no code):**
1. Admin → Products → open a product → **Images**.
2. Remove a placeholder, **Upload** your real photo (goes to Supabase Storage),
   set the primary image. Done — the storefront updates immediately.

**Bulk (before first seed):** drop your real images into `public/products/` using
the same names (`<slug>-1.svg` → or change the seed URLs to `.jpg`), then seed.

The hero slides are managed in Admin → Homepage. Everything is editable without
touching code — the placeholders are just a starting point you overwrite with real
data as stock arrives.
