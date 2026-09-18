# Al-Qa’im

A production-ready e-commerce platform for Al-Qa’im, a premium footwear store:
an ink-and-gold storefront with a real-time 3D hero, a variant-aware catalogue,
real orders and inventory, and an admin CMS that genuinely drives what
customers see.

Built with Next.js 15 (App Router), React 19, TypeScript in strict mode,
PostgreSQL via Prisma, Auth.js v5, Tailwind, three.js and Framer Motion.

> **Launching?** Read [DEPLOYMENT.md](DEPLOYMENT.md) — it includes the
> launch checklist (remove demo data, set your logo, add your products).

---

## Contents

1. [What it does](#1-what-it-does)
2. [Quick start](#2-quick-start)
3. [Environment variables](#3-environment-variables)
4. [Database](#4-database)
5. [Photography pipeline](#5-photography-pipeline)
6. [Project structure](#6-project-structure)
7. [Admin and the storefront](#7-admin-and-the-storefront)
8. [Roles and permissions](#8-roles-and-permissions)
9. [Payments](#9-payments)
10. [Email](#10-email)
11. [Image uploads](#11-image-uploads)
12. [SEO](#12-seo)
13. [Accessibility and motion](#13-accessibility-and-motion)
14. [Security notes](#14-security-notes)
15. [Production build and deployment](#15-production-build-and-deployment)
16. [Testing checklist](#16-testing-checklist)
17. [Known gaps](#17-known-gaps)

---

## 1. What it does

**Storefront**

- 3D hero (three.js): cut-out product photography floating inside metallic
  gold rings, with a gold-dust field, pointer parallax and a scroll dolly —
  slides, order and timing managed in Admin → Homepage
- "Popular right now" category pills that re-query the database via the URL
- Editorial new-arrivals rail, category grid, campaign banner, weekly pick
- Shop with search, and filters for category, brand, gender, size, colour,
  price, rating, availability and sale — all server-side, all shareable URLs
- Product pages with a zoomable gallery, colour/size variants, live stock,
  reviews with a rating distribution, verified-buyer review submission
  (moderated), and related products
- Cart (database-backed for customers, cookie-token for guests), coupons,
  checkout, order history, wishlist, addresses and account management

**Admin** (`/admin`)

- Dashboard with real revenue, orders, customers, top products and low stock
- Products with variants, images, inventory, flags and per-product SEO
- Categories (with photo, description and SEO), inventory adjustments,
  orders, customers, a contact-form inbox, reviews, coupons, banners, users,
  site settings (including the logo) and an activity log
- Homepage CMS: hero copy, hero slides (image, linked product, timing, order,
  active state), weekly pick and membership block

---

## 2. Quick start

Requires **Node.js 20+** and a PostgreSQL database (these instructions assume
Supabase; any Postgres works).

```bash
npm install
cp .env.example .env     # then fill it in — see section 3
npm run db:push          # create the tables
npm run assets:build     # download and process the product photography
npm run db:seed          # catalogue, orders, reviews, CMS content
npm run dev
```

Open <http://localhost:3000>. The seed prints the admin credentials it created.

---

## 3. Environment variables

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Runtime connection. On Supabase, the **transaction pooler** URL (port 6543, `?pgbouncer=true`) — pooled, so it survives serverless. |
| `DIRECT_URL` | yes | Migrations only. The **direct** connection (port 5432); `prisma migrate` and `db push` need to bypass the pooler. |
| `AUTH_SECRET` | yes | Signs session JWTs. Generate with `npx auth secret` or `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | yes | The site's own origin, e.g. `https://alqaim.store`. Auth.js builds its redirects from it, so it must match the URL you serve from. |
| `NEXT_PUBLIC_SITE_URL` | yes | Public origin, used for canonical URLs, Open Graph, sitemap and JSON-LD. **Set this in production** or those URLs point at localhost. |
| `SEED_ADMIN_EMAIL` | no | Email for the admin the seed creates. Default `admin@alqaim.test`. |
| `SEED_ADMIN_PASSWORD` | no | Its password. Default `changeme123` locally; the seed **refuses** to run with `NODE_ENV=production` unless you set a 12+ character one. |
| `NEXT_PUBLIC_SUPABASE_URL` | for uploads | Supabase project URL, for admin image uploads. |
| `SUPABASE_SERVICE_ROLE_KEY` | for uploads | Service-role secret. Server-only; never referenced from client code. |
| `SUPABASE_STORAGE_BUCKET` | for uploads | Public bucket name, default `product-images`. |
| `STRIPE_SECRET_KEY` | no | Not wired up. See [Payments](#9-payments). |
| `RESEND_API_KEY` | no | Not wired up. See [Email](#10-email). |

`.env` is git-ignored. Never commit real secrets; put them in your host's
environment settings instead.

---

## 4. Database

```bash
npm run db:push      # push the schema (development)
npm run db:migrate   # create a migration (preferred for production)
npm run db:seed      # idempotent — safe to re-run
npm run db:studio    # browse the data
```

The schema covers users and roles, products with colours, sizes, images and
variants, variant-level inventory, carts, wishlists, orders, order items,
payments, addresses, reviews, coupons and coupon usage, plus the CMS models
(homepage, hero slides, banners, site settings, SEO settings), contact messages
and an admin activity log.

The seed is **idempotent**: it upserts on natural keys, so re-running it fills
in anything missing without overwriting edits made in Admin.

**Creating the first admin.** The seed creates one from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`. To promote an existing account instead, sign up normally
and then run:

```bash
npx prisma studio      # Users → set role to SUPER_ADMIN
```

---

## 5. Photography pipeline

No image is hardcoded to a remote URL — everything is served from `/public`.

```bash
npm run assets:build            # fetch only what's missing
npm run assets:build -- --force # rebuild everything
```

`scripts/assets.manifest.json` lists every photograph. The pipeline
(`scripts/prepare-images.mjs`) downloads each one into a git-ignored cache,
then writes:

- `public/products/<slug>-1..3.webp` — 1200×1200 gallery shots
- `public/hero/hero-N.png` — hero shoes with the studio backdrop **keyed out**
  to transparency, so they float over the brand circle
- `public/banners/*.webp` and `public/categories/*.webp`

The cut-out uses region growing seeded from the image border: a pixel joins the
backdrop when it is close both to the neighbour it spread from and to the
backdrop's overall colour. That follows soft vignettes and cast shadows while
the shoe's hard edge stops it. Each hero entry has a `tolerance` — raise it if a
halo of backdrop survives, lower it if the shoe itself starts eroding (white
shoes on a white seamless need the lowest values). If a backdrop turns out not
to be keyable, the pipeline says so and ships the untouched photo rather than a
destroyed one.

**Using your own photography.** Either replace the files in `/public` directly
(keep the names), or point the manifest at your own sources. Nothing in the app
needs to change.

The bundled photographs come from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license), which permits free commercial
use. Swap them for your own brand photography before launch.

---

## 6. Project structure

```
app/
  (store)/            storefront — home, shop, product, category, cart,
                      checkout, account, legal, about, contact
  admin/              admin dashboard and CMS
  api/                search suggestions, image upload, health, auth
components/
  brand/              logo mark and wordmark
  layout/             header, footer, search dialog
  product/            cards, gallery, buy panel, filters, wishlist, review form
  store/hero/         hero copy + controls, and the three.js stage
  store/              other homepage sections
  checkout/  cart/  account/  admin/  ui/
lib/
  auth/               Auth.js config (split edge/node), session, permissions
  cache/              shared storefront cache + admin-side invalidation
  db/                 Prisma client singleton
  products/           catalogue queries, pricing
  orders/             order placement, totals, coupons
  reviews/            verified-buyer review submission
  security/           Postgres-backed rate limiting
  brand.ts            store name and tagline
  cart/  account/  admin/  settings/  storage/  payments/  validations/
prisma/
  schema.prisma       the data model
  catalog.ts          the demo catalogue (what the store sells)
  seed.ts             how it gets into Postgres
scripts/
  assets.manifest.json  every photograph's source
  prepare-images.mjs    download, optimise, background removal
  prepare-launch.ts     removes the seed's demo customers, orders and reviews
```

---

## 7. Admin and the storefront

Admin is not a separate world — it edits the same rows the storefront reads:

| Change in Admin | Effect |
| --- | --- |
| Homepage → Hero heading | The homepage `<h1>` |
| Homepage → Hero slides | Which shoes rotate, their order and timing |
| Homepage → Weekly pick | The Weekly Pick block (with a working buy panel) |
| Products → price / sale price | Card, product page, cart, checkout and order totals |
| Products → New arrival | Appears in the New Arrival rail |
| Products → Featured | Appears in Popular right now |
| Products → Published off | Disappears from the storefront and the sitemap |
| Categories → photo / description | Header "Collections" menu, homepage category grid, category banner |
| Settings → logo | Header, footer, admin sidebar (replaces the built-in Al-Qa’im mark) |
| Settings → store name | Page titles, header, footer, emails-to-be |
| Banners | The campaign band (respects start/end dates) |
| Settings → currency / shipping / tax | Every price, the cart, the checkout and new orders |
| Settings → social links | Footer icons (hidden when unset, rather than linking nowhere) |

Every mutation revalidates what it touched — including the shared storefront
cache (`lib/cache/storefront.ts`) that holds settings, navigation categories,
hero slides and featured reviews — so changes appear on the next request.

---

## 8. Roles and permissions

`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EDITOR`, `CUSTOMER`. Roles map to granular
permissions (`products.write`, `orders.write`, `reviews.moderate`,
`homepage.write`, `settings.write`, `users.manage`, …) in
`lib/auth/permissions.ts`.

Enforcement is in two layers, and the second is the one that matters:

1. `middleware.ts` keeps non-admins out of `/admin` routes.
2. Every server action calls `requirePermission(...)` before it touches data.

Hiding a button is presentation, not security — the server never trusts the UI.
(The admin sidebar does hide sections a role can't open, purely so nobody is
shown a link that leads to a "forbidden" page.)

Roles are read **from the database on every request**, not from the session
token, so demoting or deleting an admin takes effect immediately rather than
when their token expires.

---

## 9. Payments

Checkout depends on the `PaymentProvider` interface in
`lib/payments/provider.ts`, never on a concrete provider.

**Cash on delivery is the only method wired up.** It is real: the order is
recorded with payment status `PENDING` and collected on delivery. Card payment
is *not* faked — asking for an unconfigured method throws rather than pretending
to succeed.

To add a provider: implement `PaymentProvider`, register it in
`getPaymentProvider()`, and add the method to the `paymentMethod` enum in
`lib/validations/checkout.ts`. Checkout itself needs no changes.

---

## 10. Email

There is no email provider configured, and the app does not pretend otherwise —
no code claims to have sent a message it didn't send. Contact form submissions
are stored in the `ContactMessage` table and read, marked and answered (via
your mail client) in **Admin → Messages**.

To add email, write a service behind a small interface (mirroring
`lib/payments/provider.ts`), configure `RESEND_API_KEY` or your provider's
equivalent, and call it from `placeOrder`, the order-status action and the
registration action.

---

## 11. Image uploads

Admin image uploads go to Supabase Storage. Create a **public** bucket named
`product-images` (Storage → New bucket), then set `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_STORAGE_BUCKET`.

`POST /api/upload` requires a role that can edit products, the homepage or
settings, caps files at 5 MB and accepts only JPEG, PNG, WebP and AVIF —
identified from the file's **bytes**, not the name or the browser's claimed
type, and stored under a server-generated name. Without configuration it
returns `501` and says so. Binaries are never stored in Postgres.

Image URLs typed into the admin are validated too: a path on this site, or an
https URL on Supabase Storage or Cloudinary. Anything else is refused at save
time, because `next/image` would otherwise throw on the storefront.

For S3 or Cloudinary instead, reimplement `lib/storage/supabase.ts` against the
same two exports and add the hostname to `images.remotePatterns` in
`next.config.ts`.

---

## 12. SEO

- Per-page metadata through the Next.js Metadata API, with product and category
  copy coming from the database and site-wide defaults editable in Admin → SEO
- Canonical URLs; filtered and searched listings point back at `/shop`
- JSON-LD: `Product` (with real availability and ratings only when approved
  reviews exist), `BreadcrumbList`, `CollectionPage`, `Organization`, `WebSite`
- `sitemap.xml` generated from published products and active categories;
  `robots.txt` excludes `/admin`, `/account`, `/cart`, `/checkout` and `/api`
- Semantic HTML with one `<h1>` per page, and product content server-rendered
  rather than hidden behind client state

Set `NEXT_PUBLIC_SITE_URL` in production — canonical URLs, Open Graph images and
the sitemap are all built from it.

---

## 13. Accessibility and motion

Semantic landmarks, a skip link, labelled controls, visible focus rings,
keyboard-navigable gallery and dialogs, `aria-live` on stock and result counts,
and focus returned to the trigger when an overlay closes.

Scroll reveals are **CSS, not JavaScript animation**, and their hidden state is
scoped to `[data-js="on"]` — set by a tiny inline script before first paint. If
that script never runs (a crawler, a blocked bundle), every section renders
visible. Nothing can strand content at `opacity: 0`.

**The hero.** The three.js stage is loaded only on the homepage, after
hydration; a server-rendered poster paints first and is the fallback where
WebGL is unavailable. Rendering stops whenever the hero is off-screen, the tab
is hidden or the visitor presses pause, and every GPU resource is disposed on
unmount. The carousel has a visible pause control (WCAG 2.2.2).

**Reduced motion.** With `prefers-reduced-motion` (which Windows turns on when
"Show animations" is off) the hero switches to a *gentle* mode — shoes
cross-fade in place, the rings keep turning slowly, and the fly-through,
parallax and scroll dolly are removed — rather than freezing. There is
deliberately no blanket `transition-duration: 0` rule: it flattened every
hover and fade on the site for those visitors.

---

## 14. Security notes

- Passwords hashed with bcrypt (cost 12); sign-in compares against a real
  dummy hash for unknown emails so response time doesn't reveal which accounts
  exist
- **Rate limiting** (Postgres-backed, so it works across serverless instances)
  on sign-in (per IP and per account, enforced inside Auth.js so the raw
  callback endpoint is covered), registration, the contact form (plus a
  honeypot), coupon checks, checkout and review submission
- Post-login redirects accept same-site paths only (no open redirect)
- All input validated with Zod, on the server, at the boundary
- **Prices, discounts, shipping and tax are always recomputed server-side** from
  the database when an order is placed. The browser's numbers are a preview.
- Coupons are re-validated at order time — active flag, expiry, minimum order,
  total usage cap and per-customer cap. Usage is recorded for guest checkouts
  too, so a cap on a coupon is a real cap.
- Stock decrements are guarded (`available >= quantity`) inside the same
  transaction that writes the order, so two simultaneous buyers can't oversell
- Parameterised queries throughout Prisma; no string-built SQL
- Order status changes are claimed atomically, so a double click or two
  admins can't restock a cancelled order twice; reopening a cancelled order
  re-takes stock only if it is still there
- Products unpublished after they were added to a basket can't be checked out
- Security headers (a safe CSP subset — `frame-ancestors`, `base-uri`,
  `form-action`, `object-src` — plus HSTS, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) in
  `next.config.ts`
- Admin actions written to `AdminActivityLog` with actor, action and entity

---

## 15. Production build and deployment

```bash
npm run build
npm start
```

Suits any Next.js host; Vercel is the shortest path.

1. Push the repository and import it.
2. Add every variable from section 3 to the project's environment settings.
   `NEXT_PUBLIC_SITE_URL` must be the real domain.
3. Use a **pooled** `DATABASE_URL` — serverless functions exhaust direct
   connections quickly.
4. Run migrations against production:
   ```bash
   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
   ```
5. Seed once: `npm run db:seed` (creates the admin, settings and CMS copy,
   plus a demo catalogue).
6. **Change the seeded admin password**, or delete the account and promote your
   own.
7. Remove demo data before opening: `npm run launch:prepare -- --apply`
   (add `--catalog` to also unpublish the demo products).
8. Deploy the functions in the same region as the database — `vercel.json`
   pins Mumbai (`bom1`) to match a Supabase `ap-south-1` project. Every page
   makes several database round trips; across continents that is seconds.
9. Commit the generated `/public` images, or run `npm run assets:build` as part
   of the build.

---

## 16. Testing checklist

Verified during development:

- Registration, login, logout; case-insensitive email matching
- Browsing, search (name, SKU, tag, brand, category), every filter and sort
- Variant selection with per-size stock; sold-out sizes disabled
- Add to cart, quantity limits, remove; guest cart persists via cookie
- Coupon validation, checkout, order creation, stock decrement, order history
- Unauthenticated `/admin/*` and `/account/*` redirect to login
- `POST /api/upload` returns 403 without an admin role
- Over-quantity stock decrements are refused by the database guard
- Layout holds from 320 px to 1920 px with no horizontal overflow

Worth re-running after changes: place an order, confirm the order row's totals
match what checkout displayed, and confirm inventory dropped by the right amount.

---

## 17. Known gaps

Honest list of what is *not* done:

- **No automated test suite.** Testing so far has been manual. A store handling
  real money should have integration tests around `placeOrder` first.
- **Card payments and email are unconfigured**, by design — both sit behind
  interfaces, neither is faked.
- **Legal pages are a starting point, not legal advice.** Passages marked
  `[REVIEW]` (company details in the imprint especially) need a lawyer before
  launch.
- **Tax is a single flat rate.** `calculateTotals` is the one place to change
  for per-zone or per-product tax.
- **Shipping is flat plus a free-delivery threshold.** Zones would slot into the
  same function.
- **Product images are stock photography**, and the seeded reviews, customers
  and orders are demo data. `npm run launch:prepare` removes the demo people,
  orders and reviews; replace or unpublish the demo products before selling.
- **No self-service password reset.** It needs an email provider; until one
  is configured, the login page points customers to the contact form.
- **The logo is a vector recreation** of the Al-Qa’im mark. Upload the original
  artwork in Admin → Settings → Logo and it replaces the built-in mark
  everywhere.
