# Shoe Express — Deployment Guide

This walks you from a fresh clone to a live production site on **Vercel +
Supabase**. Every step is a real command or dashboard action.

---

## 0. Prerequisites

- Node.js 20+ locally
- A Supabase project (you have one)
- A Vercel account (free tier is fine)
- This repository pushed to GitHub/GitLab

---

## 1. Local setup & verification (do this first)

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then fill in the values (see §2)
npm run db:push             # create tables in Supabase
npm run assets:build        # download + process the product photography
npm run db:seed             # seed admin, products, reviews, coupons, CMS
npm run dev                 # http://localhost:3000
```

**Before deploying, confirm the production build succeeds locally:**

```bash
npm run build               # prisma generate + next build — must pass clean
npm run start               # serve the production build on :3000
```

If `npm run build` passes, you are green to deploy. (This is the step that can't
run in a restricted sandbox because Prisma downloads its query engine at
generate-time; on any normal machine/CI it just works.)

---

## 2. Environment variables

From **Supabase → Connect → ORMs → Prisma**, copy both URLs:

| Variable | Where | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Transaction pooler (port 6543, `?pgbouncer=true`) | runtime |
| `DIRECT_URL` | Direct connection (port 5432) | migrations only |
| `AUTH_SECRET` | `npx auth secret` or `openssl rand -base64 32` | required |
| `NEXTAUTH_URL` | your production URL | e.g. `https://shoeexpress.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | your production URL | used in sitemap/OG/canonical |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | image upload |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | **server-only secret** |
| `SUPABASE_STORAGE_BUCKET` | `product-images` | must exist & be public |

---

## 3. Supabase Storage (for product/banner images)

1. Supabase → **Storage** → **New bucket** → name `product-images` → **Public**.
2. That's it — the app uploads via the service-role key server-side.

---

## 4. Deploy to Vercel

1. Vercel → **Add New → Project** → import your Git repo.
2. Framework preset: **Next.js** (auto-detected).
3. **Environment Variables**: paste every variable from §2.
4. **Build command**: leave default (`next build`) — our `build` script runs
   `prisma generate` first via `package.json`.
5. Click **Deploy**.

### First-time production database

Run migrations against production once (locally, pointing at prod `DIRECT_URL`):

```bash
# with production DATABASE_URL/DIRECT_URL in your shell or a temporary .env
npx prisma migrate deploy      # if you use migrations
# — or —
npm run db:push                # if you use db push
npm run db:seed                # seed the first admin + content

# Images live in /public. Either commit them, or run the pipeline in CI:
npm run assets:build
```

> Prefer `prisma migrate deploy` for production (tracked, reversible). Use
> `db:push` only for the very first bootstrap if you haven't created migrations.

---

## 5. Create the first admin

The seed creates `admin@shoeexpress.test` / `changeme123` (or your
`SEED_ADMIN_*`). **Log in and change the password immediately** at
`/account/profile`, or create a fresh admin and delete the seeded one.

To promote an existing user to admin without the seed, use Prisma Studio:

```bash
npm run db:studio    # open the User table, set role = SUPER_ADMIN
```

---

## 6. Post-deploy smoke test

Hit these on the live URL:

- `/` — homepage renders, hero animates
- `/shop` — products load, filters work (`?category=sneakers`)
- `/products/aero-runner-teal` — detail + variant selection
- add to cart → `/cart` → `/checkout` → place COD order → `/checkout/success`
- `/account/orders` — the order appears
- `/admin` — dashboard metrics load (log in as admin)
- `/api/health` — returns `{ "status": "ok", "db": "up" }`
- `/sitemap.xml` and `/robots.txt` — resolve

---

## 7. Custom domain

Vercel → Project → **Domains** → add your domain → follow DNS instructions.
Then update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the custom domain and
redeploy.

---

## 8. Ongoing

- **Payments:** COD works today. To add cards, implement a provider in
  `lib/payments/provider.ts` (the interface is already there) and add its keys.
- **Email:** wire a provider (e.g. Resend) behind an email service; until then the
  app never claims an email was sent.
- **Backups:** Supabase provides automated backups on paid tiers.
- **Monitoring:** point an uptime monitor at `/api/health`.
