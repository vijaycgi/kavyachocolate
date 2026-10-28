# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js 16 (App Router) + TypeScript, Tailwind CSS v4, Prisma + SQLite for local development (PostgreSQL-ready schema), custom server-verified admin sessions. Chosen because the brief requires one persistent application with a public storefront, protected dashboard, server actions, and no external service dependency for the demo.

## Users

- **Shoppers** in India and abroad buying small-batch dark chocolate for themselves, as gifts, or for festive occasions. They browse on mobile, care about ingredients and craft, and expect a calm, premium buying experience.
- **The owner/operator** (Kavya Chocolat) running daily operations from a laptop or phone: reviewing new orders, updating fulfillment, adjusting stock, and checking sales. Not a developer; needs clear labels, safe defaults, and no exposed credentials.

## Product Purpose

Sell four bean-to-bar chocolate bars direct to customers, take orders without an online payment step, and let the owner run orders, inventory, fulfillment, customers, and store configuration from one dashboard. Success means a customer can order in under three minutes and the owner can take that order from placed to delivered or collected without leaving the admin.

## Positioning

Real cocoa beans, minimal ingredients, honest labeling, and small-batch craft — not a reseller catalogue. The storefront explains what is in each bar and what is deliberately absent. Jaggery bars are presented as jaggery-sweetened, never as sugar-free.

## Operating Context

- Launch market: India. INR is the default and only configured selling currency.
- Fulfillment: courier shipping (domestic and international), local delivery by postal-code area, and pickup at a configured location.
- Orders are placed without payment collection. The owner confirms by email/phone and arranges payment offline until a gateway is added.
- Products are made in small batches; stock counts are real and must not oversell.
- The owner edits products, stock, shipping rules, and pickup details without a deploy.

## Capabilities and Constraints

- Four products, each with variants/SKUs, stock, ingredients, allergens, shipping eligibility, and publish state.
- Guest checkout. Customer accounts are not required.
- No payment gateway, card fields, payment webhooks, or payment status. Orders carry `placed → processing → ready for pickup / shipped / out for delivery → delivered / collected → cancelled`.
- Inventory decrements in the same database transaction that creates the order, with an idempotency key to prevent duplicate orders.
- Admin authentication is server-verified for every page and server action; hiding navigation is not treated as security.
- Shipping zones, local-delivery areas, pickup locations, free-shipping threshold, and tax rate are admin-configurable. Tax defaults to 0% and is labeled unconfigured, not compliant.
- Transactional email is not configured. The UI must not claim an email was sent.
- All prices, weights, and photographs are labeled placeholders until the owner supplies real values.
- No nutrition facts, certifications, health claims, or cocoa-percentage claims beyond the supplied product names are invented.
- SQLite is a development database. Production requires PostgreSQL and a documented migration; the schema avoids SQLite-only types.

## Brand Commitments

- Name: **Kavya Chocolat**.
- Logo supplied at `C:\VJ\Kavya\Logo\kavya_chocolat.svg`: burgundy `#75212F` wordmark, cocoa-pod mark, "PREMIUM HANDCRAFTED CHOCOLATE" tagline. Preserve proportions and use the burgundy on light grounds or a light knockout on dark grounds.
- Premium, modern, minimal, artisanal. Cocoa brown, deep chocolate, warm cream, natural earthy tones. Elegant, highly readable typography.
- Reference set explicitly supplied: manamchocolate.com, Maison Claire (editorial restraint, fulfillment clarity), Nutella (warmth and appetite appeal), 21st.dev (component quality), Dribbble and Refero for layout craft.
- Avoid generic templates, excessive gradients, clutter, and decorative animation.

## Evidence on Hand

- Logo SVG (path above). All other photography is absent; stylised vector placeholder art ships in `public/images` and is labeled as replaceable.
- Four product concepts and their ingredient lists, supplied by the owner.
- No verified prices, weights, SKUs, nutrition, certifications, policies, shipping rates, tax rates, reviews, or customer data. These must remain clearly marked placeholders or be configurable in admin.

## Product Principles

1. **Honest over appetising.** Never imply a claim the label cannot defend. Placeholders are visibly placeholders.
2. **The order is the product.** Every visible action moves a real order, stock count, or setting in the database.
3. **Calm luxury.** Space, restraint, and one authored moment beat decoration.
4. **The owner's Tuesday matters.** Admin screens optimise scanning, filtering, and the next action.
5. **Reversible by design.** Cancellations restore stock; settings are editable; nothing is hard-coded into the storefront.

## Accessibility & Inclusion

WCAG 2.2 AA: keyboard-operable navigation, visible focus, labelled fields, 4.5:1 body contrast, reduced-motion support, and touch targets of at least 44px on mobile.
