# Kavya Chocolat

A complete, no-payment storefront and operations dashboard for a four-bar, bean-to-bar chocolate studio.

Shoppers browse four bars, choose a size, check out as a guest with courier shipping, Bengaluru local delivery, or studio pickup, and receive an order number. The owner signs in to a server-protected admin to move orders through fulfilment, adjust stock, manage products and customers, configure shipping and pickup, and edit store settings. **No card details are collected and no payment gateway is connected.** Ordering records a request to buy; payment is arranged offline.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Prisma 6 + SQLite** for local development. The schema is PostgreSQL-ready.

---

## Contents

- [What is included](#what-is-included)
- [What is deliberately not included](#what-is-deliberately-not-included)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Routes](#routes)
- [How an order works](#how-an-order-works)
- [Admin access](#admin-access)
- [Testing](#testing)
- [Deployment](#deployment)
- [Placeholders you must replace](#placeholders-you-must-replace)
- [Pre-launch checklist](#pre-launch-checklist)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Assets and provenance](#assets-and-provenance)

---

## What is included

**Storefront**
- Home, shop, product detail, cart, checkout, order-success, track-order, craft/story, and policies pages.
- Four seeded products with two weight variants each (70 g and 150 g), real stock counts, ingredients, allergens, and tasting copy.
- Guest checkout. No account required.
- Three fulfilment methods:
  - **Courier shipping** by country zone, with a free-shipping threshold.
  - **Local delivery** by postal-code area, with a minimum order value.
  - **Studio pickup** at a configured location, no fee.
- Server-recomputed prices, shipping, and totals. The browser cart is only a convenience; the server is authoritative.
- Idempotent order creation: retrying the same checkout does not create a second order.
- Order tracking with an order number plus the checkout email.
- Clear placeholder labelling on prices, weights, and photography.

**Admin** (`/admin`, all server-verified)
- Dashboard with today's stats, low stock, and recent orders.
- Orders list with search and status filters; order detail with allowed status transitions, tracking fields, notes, and cancellation (restores stock).
- Products and variants: create, edit, publish, price, stock, ingredients, allergens, images.
- Inventory ledger: every manual adjustment and every order movement is recorded with the resulting stock.
- Customers with order history and lifetime value.
- Shipping zones, local delivery areas, pickup locations, free-shipping threshold.
- Analytics: revenue, order counts, average order value, top products, status breakdown.
- Settings: store identity, contact, announcement, tax label/rate, policies, admin password rotation.

**Platform**
- Custom admin sessions: random 256-bit tokens, SHA-256 hashes in the database, `httpOnly` + `SameSite=Lax` cookies, 7-day expiry, secure cookies in production.
- `src/proxy.ts` performs optimistic redirects, but **every admin layout, page, server action, and admin API path re-checks the session on the server**. Hiding navigation is never treated as security.
- Money is stored as integer **paise**, never floats.
- Inventory decrements in the same transaction that creates an order and is restored on cancellation.
- WCAG 2.2 AA-minded markup: keyboard-operable menus, visible focus, labelled fields, 44px+ mobile targets, reduced-motion support.
- SEO: metadata, canonical URLs, sitemap, robots, manifest, product structured data.
- Responsive from 390px to 1440px+.

---

## What is deliberately not included

| Not included | Consequence |
| --- | --- |
| Payment gateway / card fields / payment webhooks | Orders have **fulfilment status**, not payment status. Never show "paid". Arrange payment by email/phone or bank transfer offline. |
| Transactional email | No order confirmation email is sent. The success screen and admin are the record. Do not change UI copy to claim an email was sent until an email provider is wired in. |
| Tax calculation | Defaults to 0%, labelled **"Tax (not configured)"**. Set a rate and label in Admin → Settings only after confirming your tax obligations. |
| Courier API | Tracking numbers/URLs are entered manually in the admin. Checkout ETAs are estimates, not guarantees. |
| Customer accounts | Checkout is guest-only. Customers are created/updated from orders for the owner's records. |
| Reviews, ratings, certifications, nutrition panels | None are invented. Add only verified claims. |
| Real product photography, final prices, final weights | Seeded values and stock photos are placeholders. See [Placeholders](#placeholders-you-must-replace). |

---

## Quick start

**Requirements:** Node.js 20+ (tested on Node 24), npm. No external services required for local development.

```bash
cd kavya-chocolat
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npx prisma generate
npm run db:push             # creates prisma/dev.db
npm run db:seed             # admin, products, settings, zones, pickup
npm run dev
```

Open <http://localhost:3000>. Admin is at <http://localhost:3000/admin/login>.

If port 3000 is busy, run `npm run dev -- -p 3001` and update `NEXT_PUBLIC_SITE_URL` to match.

**Seed credentials** (only used when the admin row is first created):

```
Email:    admin@kavya.local
Password: ChangeMe123!
```

Change this password immediately in **Admin → Settings → Password**, and set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` before the first production seed.

> `ADMIN_PASSWORD` only affects a **new** admin row. Re-running the seed does not overwrite an existing password hash. Use the Settings page (or delete the admin and re-seed) to rotate it.

### Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with Turbopack. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run db:push` | Sync Prisma schema to the database (development). |
| `npm run db:seed` | Idempotent seed of products, settings, zones, pickup, and the admin. |
| `npm run db:reset` | **Destructive.** Drop, recreate, and re-seed the development database. |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | Type check without emitting. |

---

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env` or a real database file.

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite path for development. For production, a PostgreSQL URL. |
| `ADMIN_EMAIL` | On first seed | `admin@kavya.local` | Used only when creating the admin. |
| `ADMIN_PASSWORD` | On first seed | `ChangeMe123!` | Hashed with bcrypt (cost 12). Change after first sign-in. |
| `ADMIN_NAME` | On first seed | `Kavya Chocolat Owner` | Display name in the admin shell. |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | `https://kavya.example` | Absolute metadata, canonical URLs, sitemap, robots, structured data. No trailing slash. |

There are no other runtime secrets. `server-only` guards the database, auth, order, and fulfilment modules from client bundling.

---

## Database

The development database is SQLite at `prisma/dev.db`. `DATABASE_URL="file:./dev.db"` is resolved relative to `prisma/`, so Prisma writes `prisma/dev.db`.

### Development

```bash
npm run db:push   # apply schema
npm run db:seed   # seed / refresh catalogue and settings
npm run db:reset  # wipe + recreate + seed
```

`prisma db push` is used because this project ships without a migration history. That is fine for local development but **not** the recommended production path.

### Production (PostgreSQL)

1. Provision PostgreSQL (Neon, Supabase, RDS, a managed instance, etc.).
2. Change the datasource provider in `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Set `DATABASE_URL` to the PostgreSQL connection string (include `sslmode=require` where required).
4. Create the initial migration and commit it:

   ```bash
   npx prisma migrate dev --name init
   ```

5. In deployment, apply migrations before starting:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   npm run build
   npm start
   ```

6. Seed once with production-safe values:

   ```bash
   ADMIN_EMAIL="owner@yourdomain.com" \
   ADMIN_PASSWORD="<strong unique password>" \
   ADMIN_NAME="Owner name" \
   npm run db:seed
   ```

The schema avoids SQLite-only column types. JSON-ish fields (`countries`, `postalCodes`) are stored as JSON strings and parsed in `src/lib/fulfillment.ts`; they port cleanly to PostgreSQL `text`.

> **SQLite in production:** possible only with a persistent volume and a single application instance. Serverless platforms lose the filesystem. Use PostgreSQL for any real deployment.

---

## Routes

### Storefront

| Route | Purpose |
| --- | --- |
| `/` | Brand home: hero, proof strip, four-bar collection, craft, jaggery note, fulfilment, closing CTA. |
| `/shop` | All published bars with price range and stock state. |
| `/products/[slug]` | Product detail, variants, tasting/ingredient copy, add to bag. |
| `/craft` | Process, ingredient philosophy, studio context. |
| `/policies` | Shipping, returns, privacy from DB settings. |
| `/cart` | Client cart, quantity edits, subtotal. |
| `/checkout` | Guest details, fulfilment method, live server quote, order placement. |
| `/order-success` | Order receipt with number, totals, fulfilment details, tracking link. |
| `/track-order` | Look up status by order number + checkout email. |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | Generated metadata routes. |

### API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/checkout/quote` | `POST` | Validates cart against DB, computes authoritative subtotal + shipping + total. No side effects. |
| `/api/orders` | `POST` | Validates checkout, re-prices, checks stock, creates the order + items + address + customer + inventory movements + event in one transaction. Rejects duplicate idempotency keys by returning the existing order. |

### Admin

| Route | Purpose |
| --- | --- |
| `/admin/login` | Admin sign-in. `noindex`. |
| `/admin` | Dashboard. |
| `/admin/orders` | Orders list, search, status filter. |
| `/admin/orders/[id]` | Order detail, allowed transitions, tracking, notes, cancel. |
| `/admin/products` | Product list. |
| `/admin/products/new` | Create product. |
| `/admin/products/[id]` | Edit product and variants. |
| `/admin/inventory` | Stock levels, low-stock view, manual adjustments, movement ledger. |
| `/admin/customers` | Customer list and history. |
| `/admin/shipping` | Zones, local delivery areas, pickup locations. |
| `/admin/analytics` | Revenue and product analytics. |
| `/admin/settings` | Store identity, policies, tax label/rate, password. |

Every admin page calls `requireAdmin()` (directly or through the dashboard layout). Every server action starts with `await requireAdmin()`. Admin routes are `noindex`, and `/admin` is disallowed in `robots.txt`.

---

## How an order works

1. **Cart is client-side only.** `localStorage` under `kavya-cart-v1`; it stores variant IDs, quantities, and display data for convenience.
2. **Quote before submit.** `/api/checkout/quote` loads variants from the database, rejects unpublished/inactive items and insufficient stock, and computes subtotal + fulfilment fee from admin-configured rules. Displayed prices are never trusted.
3. **Submit.** `/api/orders` parses with Zod, checks the idempotency key first, re-loads variants, re-checks stock and shipping eligibility, re-quotes fulfilment, and computes all totals server-side.
4. **Transaction.** One Prisma transaction:
   - creates/updates the `Customer` by email,
   - creates the `Order` with snapshotted prices (`OrderItem.unitPriceMinor`, `lineTotalMinor`, product/variant names, SKU, image),
   - decrements each variant's stock,
   - writes an `InventoryMovement` per line with `stockAfter`,
   - writes an `OrderEvent` (`PLACED`),
   - stores the shipping address or pickup snapshot.
5. **Idempotency.** The browser generates a key stored in `sessionStorage` (`kavya-checkout-key`). The same key returns the existing order rather than duplicating it.
6. **Lifecycle.**

   ```
   PLACED → PROCESSING → READY_FOR_PICKUP → COLLECTED
                       → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                       → OUT_FOR_DELIVERY → DELIVERED
   PLACED / PROCESSING / READY_FOR_PICKUP → CANCELLED
   ```

   `DELIVERED`, `COLLECTED`, and `CANCELLED` are terminal. Cancelling restores stock and records the movement and event. The allowed graph lives in `src/lib/validation.ts`; the transaction lives in `src/lib/orders.ts`.

**Fulfilment defaults (seeded, editable in admin)**

| Method | Rule | Fee | Free over |
| --- | --- | --- | --- |
| Courier, India | `IN` zone | ₹80 | ₹1,500 |
| Courier, international | `US GB CA AU AE SG DE FR` | ₹1,800 | never |
| Local delivery | postal codes `560*`, min order ₹600 | ₹60 | ₹1,500 |
| Pickup | active pickup location | ₹0 | — |

Countries outside configured zones are rejected with a clear message. There is no automatic currency conversion; INR is the only configured currency.

---

## Admin access

- Sign in at `/admin/login`.
- Sessions last 7 days. Changing the password deletes all other sessions for that admin.
- Sign-out clears both the cookie and the database session row.
- To add a second admin, insert an `AdminUser` row with a bcrypt hash (cost 12) using Prisma Studio (`npx prisma studio`) or a seed script. There is intentionally no public admin sign-up.
- If the password is lost: update the row with a new bcrypt hash, or delete the admin and re-run the seed with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## Testing

### Automated checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

### Browser end-to-end harnesses

Two Puppeteer scripts live in `scripts/`. They are development QA tools, not part of the app runtime, and expect the seeded database and a dev server.

```bash
# Terminal 1
npm run dev -- -p 3001

# Terminal 2
npm install --no-save puppeteer-core
node scripts/e2e-checkout.mjs
node scripts/e2e-admin.mjs
```

- `e2e-checkout.mjs`: selects a 150 g variant, adds to bag, verifies persistence, fills checkout, checks the live quote, places an order, verifies the receipt and empty cart, then tracks the order.
- `e2e-admin.mjs`: signs in, updates an order status, adjusts stock, saves/restores the announcement, rotates the password, signs out, signs back in with the temporary password, and restores the original password. It expects the order created by `e2e-checkout.mjs`, so run that first.

Both scripts hard-code `http://localhost:3001` and `C:\Program Files\Google\Chrome\Application\chrome.exe`. Adjust `base` / `executablePath` for another machine. **They create and mutate real records in the development database.** Run `npm run db:reset` afterwards if you want a clean demo.

### Manual test checklist

1. Shop → product → select both sizes → add to bag → cart persists after reload.
2. Checkout as a guest with a domestic address; confirm the quote, place the order, confirm the receipt.
3. Repeat with a Bengaluru `560xxx` postal code using local delivery.
4. Repeat with a non-configured country; confirm shipping is refused and pickup still works.
5. Submit the same checkout twice (double-click / retry); confirm only one order exists.
6. Place an order for the last unit of a variant; confirm the next attempt is refused and stock is 0.
7. Admin: move an order through its allowed statuses; confirm disallowed transitions are unavailable.
8. Cancel a processing order; confirm stock is restored and a movement + event are recorded.
9. Adjust stock in Inventory; confirm the ledger and storefront availability update.
10. Change a setting; confirm the storefront reflects it without a rebuild.
11. Sign out and request `/admin`; confirm a redirect to login.
12. Keyboard-only pass, 390px pass, and `prefers-reduced-motion: reduce` pass.

---

## Deployment

### Option A: Vercel + PostgreSQL (recommended)

1. Push the project to a Git repository.
2. Create a PostgreSQL database (Neon/Supabase/Vercel Postgres).
3. Switch the Prisma provider to `postgresql`, run `npx prisma migrate dev --name init` locally, and commit `prisma/migrations/`.
4. Import the repo into Vercel.
5. Set environment variables:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SITE_URL` (the production HTTPS URL)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (first seed only)
6. Set the build command to apply migrations, generate the client, and build:

   ```bash
   npx prisma migrate deploy && npx prisma generate && next build
   ```

7. Seed once from a local shell pointed at the production `DATABASE_URL`, or run `npm run db:seed` as a one-off job.
8. Sign in, change the password, and replace placeholder settings/products.

### Option B: Node host with a persistent disk

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
npm start          # defaults to port 3000; set PORT if needed
```

Put a reverse proxy (Caddy/nginx) with HTTPS in front. Production cookies are `secure`, so **HTTPS is required** or admin sign-in will not persist. Keep one instance if you insist on SQLite with a mounted volume; otherwise use PostgreSQL.

### Deployment notes

- `NEXT_PUBLIC_SITE_URL` must be the final HTTPS origin, or canonical URLs, sitemap entries, and structured data will point at localhost.
- Admin routes and API routes use the Node.js runtime (Prisma). Do not deploy to an edge-only runtime.
- Back up the database before seeding or destructive changes. The seed is idempotent for products/settings but does not delete orders.
- `npm run db:reset` is destructive. Never run it against production.
- No payment or email secrets are needed. If you add either later, use server-only env vars and keep them out of `NEXT_PUBLIC_*`.

---

## Placeholders you must replace

These are intentionally shipped as placeholders and are labelled as such in the UI or docs. Replace before selling.

| Item | Current placeholder | Where to change |
| --- | --- | --- |
| Prices | ₹480 / ₹540 / ₹520 / ₹590 (70 g); ₹980 / ₹1,100 / ₹1,060 / ₹1,200 (150 g) | Admin → Products → variant prices |
| Weights | 70 g and 150 g | Admin → Products → variants |
| SKUs | `KC-C70-070` … `KC-JDF-150` | Admin → Products |
| Product photography | Pexels/Unsplash stock, labelled "placeholder photograph" in alt text | Replace files in `public/images/products/` and update product image paths |
| Editorial photography | Stock still life | Replace in `public/images/editorial/` |
| Store email | `hello@kavya.example` | Admin → Settings |
| Store phone | `+91 00000 00000` | Admin → Settings |
| Studio address | "Studio address pending" | Admin → Settings |
| Pickup address | "Pickup address pending" | Admin → Shipping |
| Instagram URL | `https://instagram.com/` | Admin → Settings |
| Tax | 0%, "Tax (not configured)" | Admin → Settings, after confirming obligations |
| Shipping fees/ETAs | ₹80 India, ₹1,800 international, 3–6 / 10–18 days | Admin → Shipping |
| Local delivery | `560*`, ₹60, min ₹600 | Admin → Shipping |
| Policies | Placeholder shipping/returns/privacy text | Admin → Settings → Policies; have them reviewed |
| Allergen declarations | "pending final verification" for plain bars | Admin → Products, after label review |
| Cocoa percentages | Only where supplied in product names; jaggery bars have none | Do not invent |
| Reviews / nutrition / certifications | Absent | Do not add unverified claims |

**Copy rules baked into the UI, keep them:**
- Jaggery is described as unrefined cane sugar, **never** sugar-free or "no sugar".
- No health claims, detox claims, or invented certifications.
- Do not claim an email was sent while email is not configured.
- Do not describe an order as paid.

---

## Pre-launch checklist

### Product truth
- [ ] Every price and weight matches the real product.
- [ ] Ingredients and allergen declarations are verified against the actual labels and local regulations.
- [ ] Cocoa percentages are accurate; jaggery bars make no percentage claim that has not been tested.
- [ ] No "sugar-free", health, nutrition, or certification claim is present unless verified.
- [ ] Product photography is your own; alt text no longer says "placeholder photograph".
- [ ] Policies reviewed by someone qualified (shipping, returns, privacy, food labelling).

### Store configuration
- [ ] Store name, email, phone, address, and Instagram are real.
- [ ] Shipping zones, fees, free-shipping threshold, and ETAs are real.
- [ ] Local delivery postal patterns, fee, minimum order, and schedule are real.
- [ ] Pickup address, hours, phone, and instructions are real.
- [ ] Tax rate and label are correct, or explicitly left at "not configured".
- [ ] Announcement is accurate.
- [ ] Placeholder images removed from `public/images` if unused.

### Access and security
- [ ] Default admin password changed; production seeded with a unique strong password.
- [ ] `ADMIN_PASSWORD` is not committed; `.env` is git-ignored.
- [ ] Production URL is HTTPS and `NEXT_PUBLIC_SITE_URL` matches it.
- [ ] `/admin` redirects to login when signed out; a direct admin URL cannot be opened without a session.
- [ ] A test admin server action (e.g. status update) succeeds when signed in and is rejected when signed out.
- [ ] Database backups are scheduled.
- [ ] Error monitoring is configured (optional but recommended).

### Functional pass
- [ ] Domestic shipping order placed end to end.
- [ ] International order placed for a configured country; unconfigured country refused.
- [ ] Bengaluru local delivery quote and placement.
- [ ] Pickup placement.
- [ ] Stock decrement, sold-out state, and cancellation restore.
- [ ] Duplicate submit produces one order.
- [ ] Track order works with the correct email and rejects a wrong one.
- [ ] Admin status transitions, tracking, notes, and password rotation.
- [ ] Settings changes appear on the storefront.

### Quality
- [ ] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- [ ] Keyboard-only checkout and admin pass.
- [ ] 390px, 768px, 1024px, and 1440px visual pass.
- [ ] Reduced-motion pass.
- [ ] Contrast spot-check on burgundy, cream, and brass text.
- [ ] 404 and error pages reviewed.
- [ ] Sitemap and robots use the production domain.

---

## Project structure

```
kavya-chocolat/
├─ prisma/
│  ├─ schema.prisma        # data model
│  ├─ seed.ts              # admin, products, settings, zones, pickup
│  └─ dev.db               # local SQLite database (do not commit)
├─ public/images/
│  ├─ kavya-chocolat-logo.svg
│  ├─ products/            # placeholder product photography
│  └─ editorial/           # placeholder editorial photography
├─ scripts/
│  ├─ build-images.mjs     # re-crops source photography
│  ├─ e2e-checkout.mjs     # storefront E2E
│  ├─ e2e-admin.mjs        # admin E2E
│  └─ shots.mjs            # responsive screenshot harness
├─ src/
│  ├─ app/
│  │  ├─ (store)/          # storefront routes + shared layout
│  │  ├─ admin/            # login, dashboard pages, server actions
│  │  ├─ api/              # quote + order endpoints
│  │  ├─ globals.css       # design tokens + shared components
│  │  └─ layout.tsx        # fonts, metadata, viewport
│  ├─ components/
│  │  ├─ admin/            # shell, forms, tables, confirm dialog
│  │  ├─ cart/             # localStorage cart provider + drawer
│  │  ├─ store/            # header, footer, product card, purchase, checkout, tracking
│  │  └─ ui/               # status badge and small shared primitives
│  ├─ lib/
│  │  ├─ auth.ts           # hashed sessions, requireAdmin
│  │  ├─ catalog.ts        # storefront queries
│  │  ├─ db.ts             # Prisma singleton
│  │  ├─ fulfillment.ts    # zones, local areas, pickup, quotes
│  │  ├─ money.ts          # paise formatting/parsing
│  │  ├─ orders.ts         # transactional placement, transitions, cancellation
│  │  ├─ settings.ts       # DB settings with defaults
│  │  └─ validation.ts     # Zod schemas, statuses, transition graph
│  └─ proxy.ts             # optimistic admin redirects
├─ DESIGN.md               # visual system
├─ PRODUCT.md              # product truth and constraints
├─ ASSETS.md               # photography provenance and replacement guide
└─ .env.example
```

---

## Troubleshooting

**`PrismaClientInitializationError` / "Unable to open the database file"**
Run `npm run db:push` from the project root. `DATABASE_URL="file:./dev.db"` is relative to `prisma/`.

**"The table `main.Product` does not exist"**
The schema exists but the database is empty. Run `npm run db:push && npm run db:seed`.

**Port 3000 already in use**
`npm run dev -- -p 3001`, then set `NEXT_PUBLIC_SITE_URL="http://localhost:3001"` and restart. `scripts/shots.mjs` and the E2E scripts assume port 3001.

**Admin login redirects back to login in production**
Production cookies are `secure`. Serve over HTTPS, or the browser will discard the session cookie.

**Seed did not change the admin password**
The seed only sets the hash when creating the admin. Use Admin → Settings → Password, or delete the admin row and re-seed.

**`package.json#prisma` deprecation warning**
Prisma 6 warns that the `prisma.seed` key in `package.json` is deprecated in favour of `prisma.config.ts`. It is harmless in this build; do not jump to Prisma 8 without a migration review.

**Images look stale after replacing a file**
Next's image optimizer caches by URL. Rename the file (as `jaggery-dryfruit-dark.jpg` does) or clear `.next/cache/images` in development.

**A quote is refused for a valid address**
Check the active shipping zone's country list and the local delivery area's postal patterns in Admin → Shipping. Patterns support exact codes, `560*` prefixes, and `560001-560100` ranges.

---

## Assets and provenance

The logo at `public/images/kavya-chocolat-logo.svg` is the supplied brand asset. All product and editorial photographs are **stock placeholders**, not photographs of Kavya Chocolat products. See [`ASSETS.md`](./ASSETS.md) for source IDs, licences, and step-by-step replacement instructions.

Design and brand context live in [`PRODUCT.md`](./PRODUCT.md) and [`DESIGN.md`](./DESIGN.md).
