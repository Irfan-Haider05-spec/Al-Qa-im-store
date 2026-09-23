# Al-Qa’im — Deployment & Launch Guide

From this repository to a live store on **Vercel + Supabase**, then from a demo
catalogue to your own products. Every step is a real command or dashboard
action.

---

## 0. Prerequisites

- Node.js 20+ locally
- A Supabase project (the current one is in **ap-south-1 / Mumbai**)
- A Vercel account (the free tier is fine to start)
- This repository on GitHub

---

## 1. Local setup & verification

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then fill in the values (see §2)
npm run db:push             # create/update tables in Supabase
npm run assets:build        # download + process the demo photography
npm run db:seed             # admin, settings, CMS copy, demo catalogue
npm run dev                 # http://localhost:3000
```

Before deploying, confirm the production build passes:

```bash
npm run build               # prisma generate + next build — must pass clean
npm run start               # serve it on :3000
```

> On Windows, stop `npm run dev` before `npm run build` — the running dev
> server locks Prisma's engine file and the build fails with `EPERM`.

---

## 2. Environment variables

From **Supabase → Connect → ORMs → Prisma**, copy both URLs.

| Variable | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Transaction pooler (port 6543, `?pgbouncer=true`) | runtime |
| `DIRECT_URL` | Session/direct connection (port 5432) | `db push` / migrations only |
| `AUTH_SECRET` | `npx auth secret` or `openssl rand -base64 32` | required, keep secret |
| `NEXTAUTH_URL` | your production URL, e.g. `https://alqaim.store` | must match the served origin — a value like `http://localhost:3000` here sends customers to a dead address |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | from the Google console (§3b) | optional; enables "Continue with Google" |
| `NEXT_PUBLIC_SITE_URL` | same production URL, no trailing slash | canonical URLs, sitemap, social previews |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | image uploads |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | **server-only secret** |
| `SUPABASE_STORAGE_BUCKET` | `product-images` | must exist and be public |

Never commit `.env`. It is git-ignored; put production values in Vercel's
environment settings.

---

## 3. Supabase Storage (for your product photos, banners and logo)

1. Supabase → **Storage** → **New bucket** → name `product-images` → **Public**.
2. That's all — uploads go through the server with the service-role key, and
   the admin's upload buttons start working.

Uploads accept JPEG, PNG, WebP and AVIF up to 5 MB. For product cut-outs in the
hero, use a **PNG or WebP with a transparent background**.

---

## 3b. Google sign-in (optional)

1. [Google Cloud console](https://console.cloud.google.com/) → create or pick a
   project → **APIs & Services → OAuth consent screen**: External, add your app
   name, support email and logo, then publish it (while it is in "Testing" only
   the test users you list can sign in).
2. **APIs & Services → Credentials → Create credentials → OAuth client ID →
   Web application**:
   - Authorised JavaScript origins: `https://your-domain.com` (and
     `http://localhost:3000` for local work)
   - Authorised redirect URIs:
     `https://your-domain.com/api/auth/callback/google`
     (and `http://localhost:3000/api/auth/callback/google`)
3. Copy the client ID and secret into Vercel → Settings → Environment
   Variables as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, then **redeploy**.
4. "Continue with Google" now appears on the login and register pages. Without
   these two variables the button is hidden and nothing else changes.

> The redirect URI must match exactly, including `https` and no trailing
> slash. A mismatch shows Google's "redirect_uri_mismatch" error.

---

## 4. Deploy to Vercel

1. Vercel → **Add New → Project** → import the GitHub repository.
2. Framework preset: **Next.js** (auto-detected). Leave the build command as is.
3. **Environment Variables**: add every variable from §2.
4. Click **Deploy**.

`vercel.json` pins the server functions to **Mumbai (`bom1`)**, next to the
Supabase database. Keep them in the same region: each page makes several
database round trips, and across continents that adds seconds to every page.
If you ever move the database, change the region to match.

### The production database

The database you have been developing against *is* a Supabase project; you can
launch on it directly or create a fresh project for production. For a fresh one:

```bash
# with the production DATABASE_URL / DIRECT_URL in .env
npm run db:push             # creates every table (including RateLimit)
SEED_ADMIN_EMAIL=you@yourdomain.com SEED_ADMIN_PASSWORD='a-long-unique-password' npm run db:seed
```

---

## 5. Launch checklist

Work through this once, in order, on the live site.

1. **Sign in to `/admin`** with the seeded admin, then go to `/account/profile`
   and **change the password**. (Or create your own account, promote it to
   `SUPER_ADMIN` in Admin → Users, and demote the seeded one.)
2. **Remove the demo data** (demo customers, their orders and their reviews):
   ```bash
   npm run launch:prepare                      # dry run — shows what it will remove
   npm run launch:prepare -- --apply           # do it
   npm run launch:prepare -- --apply --catalog # …and also unpublish the demo products
   ```
   Your admin accounts, settings, homepage copy and categories are untouched.
3. **Admin → Settings**: store name, **logo** (upload your original artwork —
   it replaces the built-in mark in the header, footer and admin), contact
   email, phone, address, **currency** (e.g. `PKR`), shipping, tax and your real
   social profile URLs (leave blank to hide an icon).
4. **Admin → Categories**: the store is organised into **departments**
   (Footwear, Clothing) with **categories** inside them (Sneakers, Shirts,
   Trousers…). Add or rename them, choose each category's department, and give
   each a **photo** and description. A category appears in the shop once one
   of its products is published. **Admin → Brands**: add your brands and choose
   which show in the shop's Brand filter. **Admin → Shop filters**: choose which
   filter groups the shop sidebar shows, and their order.
5. **Admin → Products → New**: enter the basics and click *Create & continue*.
   On the product's page, add **photos**, then under **Sizes, colours & stock**
   add colours, a size set (shoes, clothing XS–XXL, waist 28–40 — or none for
   one-size items) and the stock for each combination. The checklist at the top
   turns green when the product can be bought; then tick **Published**.
6. **Admin → Homepage**: hero heading and copy, and the **hero slides** — one
   transparent product cut-out per slide, the product it links to (for the
   name/price caption) and how long it holds. Also the weekly pick and the
   membership block.
7. **Admin → Banners**: replace the demo campaign ("Black Friday — up to 40%
   off") with a real one, or switch it off.
8. **Admin → Coupons**: `WELCOME20` and `FREESHIP` are samples — keep, edit or
   delete them.
9. **Legal pages** (`app/(store)/legal/[slug]/page.tsx`): replace the passages
   marked `[REVIEW]` — company details in the imprint especially.
10. Place a test **cash-on-delivery** order, move it through statuses in
   Admin → Orders, and check stock drops and (on cancel) comes back.

---

## 6. Post-deploy smoke test

- `/` — hero renders and rotates; header menu opens
- `/shop` — products load, filters work (`?category=sneakers`)
- a product page — colour/size selection, add to cart
- `/cart` → `/checkout` → place a COD order → `/checkout/success`
- `/account/orders` — the order appears
- `/admin` — dashboard loads; Admin → Messages shows contact-form mail
- `/api/health` — `{ "status": "ok", "db": "up" }`
- `/sitemap.xml` and `/robots.txt` — resolve with your domain

---

## 7. Custom domain

Vercel → Project → **Domains** → add your domain → follow the DNS instructions.
Then set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the custom domain and
redeploy.

---

## 8. Ongoing

- **Payments:** cash on delivery works today. To take cards, implement a
  provider in `lib/payments/provider.ts` (the interface is ready) and add it to
  the checkout's `paymentMethod` enum.
- **Email** (order confirmations, password reset): wire a provider such as
  Resend behind a small service; the app never claims to have sent an email.
- **Backups:** Supabase takes automated backups on paid plans.
- **Monitoring:** point an uptime monitor at `/api/health`.
- **Schema changes:** `npm run db:push` against the production `DIRECT_URL`,
  or adopt `prisma migrate` once the schema settles.
