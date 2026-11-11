# Customer accounts handover

This document covers the customer-account, guest-checkout, OAuth and validation work added on
top of the existing Kavya Chocolat storefront. The working tree is **uncommitted**; review and
commit once the database-backed checks below have run against a real PostgreSQL instance.

---

## 1. What was added

### Customer authentication
- Email/password registration, sign-in, sign-out, email verification, forgot/reset password.
- Passwords hashed with bcrypt cost 12. Policy: 10+ characters, ≤72 bytes, at least one letter
  and one number, small common-password denylist.
- Database-backed sessions (`CustomerSession`, 30-day expiry, sliding renewal after 24 h).
- Separate customer cookie (`kavya_customer_session`) and separate admin session/cookie
  (`kavya_admin_session`). Customer registration can never create or grant an admin.
- Optional Google OAuth with authorization code + PKCE, state cookie, expiry, redirect-URI
  pinning, and unverified-email rejection. When credentials are absent the button renders a
  truthful disabled state — nothing is simulated.

### Account dashboard
- Overview, profile, order history (status filter + pagination), order detail from saved
  order-item snapshots, saved addresses (default/edit/delete), security page
  (password change, verification, linked Google account, active sessions).
- Every account page calls `requireCustomer()`; every order query includes `customerId`, so
  changing a URL cannot read another customer's order (renders 404).
- Empty states link back to the shop.

### Guest checkout and order claiming
- Guests still check out with no account; `Order.customerId` stays `null` while the email is
  recorded on the order.
- Signed-in checkout attaches the session customer and forces the account email.
- Guest orders are claimed only after **proven** mailbox control: email verification, password
  reset via email, or a verified Google identity. Unverified or unrelated accounts never
  inherit orders.
- Registering on an existing guest-only customer row is allowed; registering over a password
  or OAuth account is rejected. Google auto-links only guest-only rows.

### Validation
- Shared zod schemas in `src/lib/validation.ts` used by client pre-validation and every
  server action/route.
- Covered: registration, login, forgot/reset password, profile, password change, address,
  checkout, admin login, product, product image, variant, tracking URL, stock adjustment,
  delivery zone, pickup location, delivery area, store settings, order status.
- Field-level messages, a form-level summary, preserved values, focus on the first invalid
  field, `aria-invalid`/`aria-describedby`, and success shown only after server confirmation.

### Rate limiting and hardening
- DB-backed fixed-window limiter keyed by hashed IP + identifier, applied to login,
  registration, password reset, verification resend and admin login. Fails open on DB outage so
  an outage cannot lock everyone out.
- Generic authentication error messages; no account enumeration on forgot-password.
- `Secure` cookies in production, `HttpOnly`, `SameSite=Lax`, path-scoped.
- Redirect safety centralised in `src/lib/redirects.ts` (`safeInternalPath`, `safeAccountNext`,
  `safeAdminNext`) and covered by tests.
- Tracking links render only for `http(s)` URLs.
- Security headers for every route in `next.config.ts`: same-origin CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, and
  `X-Powered-By` disabled.

---

## 2. Routes

| Route | Notes |
| --- | --- |
| `/account` | Requires session; `noindex`. |
| `/account/login` | Password sign-in + optional Google button. |
| `/account/register` | Creates a customer, never an admin. |
| `/account/forgot-password` | Identical response for known/unknown email. |
| `/account/reset-password` | Single-use, expiring token. |
| `/account/verify-email` | Consumes token, claims matching guest orders. |
| `/account/profile` | Name/phone edit. |
| `/account/orders` | Scoped list, filter, pagination. |
| `/account/orders/[orderId]` | Ownership in the query; 404 otherwise. |
| `/account/addresses` | CRUD + default selection. |
| `/account/security` | Password, verification, Google link/unlink, sessions. |
| `/api/auth/google/start` | `GET`; OAuth start with PKCE + state. |
| `/api/auth/google/callback` | `GET`; state check, code exchange, link/create. |
| `/api/orders` | `POST`; now reads the customer session and forces account email. |

Auth pages live under `src/app/(store)/account/(auth)/`; dashboard pages under
`src/app/(store)/account/(dashboard)/` with a shared guarded layout.

---

## 3. Database

Migration: `prisma/migrations/20261029120000_customer_accounts/migration.sql`

Separate later migration: `prisma/migrations/20261111120000_media_assets/migration.sql` adds
`MediaAsset`, which stores admin-uploaded product photos as WebP bytes in Postgres and serves
them from `/api/media/[id]`. Product galleries reuse the existing `ProductImage` table:
`position` stores the display order, and rows are created, reordered and deleted from the admin
product editor.

New model `Customer` columns/relations:
- `name`, `phone`, `passwordHash`, `emailVerifiedAt`, timestamps
- relations: sessions, tokens, OAuth accounts, addresses, orders

New tables:
- `CustomerSession` — hashed session token, expiry, last-used, IP/user agent
- `CustomerToken` — hashed verification/reset tokens, type, expiry, used-at
- `OAuthAccount` — provider + provider account id, unique per provider
- `AuthRateLimit` — fixed-window counters with expiry

Existing `Address` gained `label` and `isDefault`. `Order.customerId` is nullable and remains
null for guest orders.

```bash
npm run db:deploy   # apply migrations
npm run db:seed     # seed catalogue/settings (not required for account tables)
```

On Vercel, `npm run build` runs `prisma migrate deploy` before `next build`, so the migration
applies during deployment. It is skipped locally when `DATABASE_URL` is not a PostgreSQL URL.

---

## 4. Environment variables

| Variable | Required | Example |
| --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://user:pass@ep-x-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Yes | `postgresql://user:pass@ep-x.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `ADMIN_EMAIL` | First seed | `admin@kavya.local` |
| `ADMIN_PASSWORD` | First seed | `ChangeMe123!` |
| `ADMIN_NAME` | First seed | `Kavya Chocolat Owner` |
| `NEXT_PUBLIC_SITE_URL` | Optional on Vercel | `https://kavya.example` |
| `RESEND_API_KEY` | Optional | `re_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM` | Optional | `Kavya Chocolat <accounts@your-verified-domain.example>` |
| `GOOGLE_CLIENT_ID` | Optional | `1234567890-xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | `GOCSPX-xxxxxxxxxxxxxxxxxxxx` |

Email and Google are optional. Without `RESEND_API_KEY` + `EMAIL_FROM`, verification/reset
links are logged to the server console in development and the UI states honestly that email is
not configured in production. Without both Google variables the Google button is disabled.

---

## 5. Google OAuth setup

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID
   → Web application**.
2. Authorised redirect URIs (add every environment):
   - `http://localhost:3000/api/auth/google/callback`
   - `https://kavyachocolat.vercel.app/api/auth/google/callback`
   - any preview/custom domain you use
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` (local) and in Vercel project
   settings (production/preview).
4. Restart the server. `/api/auth/google/start` returns an explanatory redirect when the
   credentials are missing.
5. Configure the OAuth consent screen; only `openid email profile` scopes are requested.

The callback URI is derived from the request origin, so localhost and production work without
extra configuration — but both must be registered in Google Cloud.

---

## 6. Commands

```bash
npm install
npm run db:deploy
npm run db:seed
npm run dev

npx tsc --noEmit
npm run lint
npm test
npm run build
```

`npm test` runs `tsx --test "tests/**/*.test.ts"` (44 tests, Node's built-in runner; no extra
test framework).

Local build note: `npm run build` runs migrations first. With an unreachable database, use a
non-Postgres placeholder so the migration step is skipped and static generation still catches
its own DB errors:

```powershell
$env:DATABASE_URL='skip-migrations-locally'; npm run build
```

(Setting `$env:DATABASE_URL=''` deletes the variable, which lets `.env` load again.)

---

## 7. Verified in this session

- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm test` — 44/44 passing (redirect safety, password policy, register/login/checkout/
  address/admin schemas, field-error helpers, gallery ordering/composition, media limits and
  filename sanitising).
- `npx next build` — compiled successfully, TypeScript passed, 40 routes emitted.
- Product photo uploads — verified against a local PostgreSQL database: admin sign-in, file
  picker change event, `/api/admin/uploads` 201 with a 1200×1500 WebP, `/api/media/[id]` 200
  with `image/webp` and immutable caching, product save persisted the new path, unauthenticated
  upload returned 401 and a spoofed `.jpg` returned 415.
- Product image galleries — verified against local PostgreSQL: the editor loaded the seeded
  gallery, multi-file upload added an image through `/api/admin/uploads` plus
  `addProductImageAction`, the up arrow reordered rows and the order survived a reload, deleting
  a row compacted the remaining positions and removed its now-unreferenced `MediaAsset`, and the
  storefront showed the main image first with gallery URLs in JSON-LD.

## 8. Not verified here (requires external services)

- `prisma migrate deploy` against the real Neon database — the configured host was unreachable
  from this machine and no local PostgreSQL was available. **Apply and verify the migration
  before deploying.**
- End-to-end Google sign-in — needs real client credentials and registered redirect URIs.
- Resend email delivery — needs a verified sender/domain and API key.
- Cross-customer order access, session expiry, rate-limit lockout and guest-order claiming are
  implemented and code-reviewed but need a live database to exercise.

## 9. Manual test checklist

1. Register → verify email → dashboard; confirm no admin access is granted.
2. Sign out, sign in, refresh, close/reopen the browser (session persists), expire a session.
3. Forgot password → reset → old sessions revoked.
4. Guest checkout → order appears only after verifying that email; a different account cannot
   see it by URL.
5. Signed-in checkout pre-fills the default address and ignores an edited email field.
6. Duplicate submit (double-click) creates one order.
7. Google sign-in with configured credentials; disabled state without them.
8. Rate limits: repeated bad logins and repeated reset requests return the retry message.
9. Admin sign-in, product/variant/stock/tracking/settings forms reject invalid input with
   field messages; existing storefront pages render unchanged.
10. Mobile layout of all account pages; keyboard-only tab order and screen-reader labels.

## 10. Remaining configuration / security notes

- Commit and review the uncommitted working tree; run the migration first.
- Rotate the seeded admin password before launch; admin and customer auth are separate.
- Replace the placeholder catalogue/policy copy where marked in the README.
- Email verification is not required to browse the account; it is required to claim guest
  orders. Decide whether to gate checkout on verification (currently not gated).
- Rate limiting is per instance-independent Postgres counter; if traffic grows, add a CDN/WAF
  layer in front of auth endpoints.
- OAuth state/redirect validation is implemented; keep the Google console redirect list in sync
  with every deployment domain.
- `requireCustomer()` redirects to `/account/login?reason=session` without preserving the
  original path; add a `next` parameter if deep-link return matters.
