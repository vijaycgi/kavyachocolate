import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  {
    slug: "classic-70-dark-chocolate",
    name: "Classic 70% Dark Chocolate",
    collection: "CLASSIC",
    tagline: "Two ingredients. One honest bar.",
    cocoaPercent: 70,
    description:
      "Our house bar, made from cocoa beans and sugar and nothing else. Roasted, refined and tempered in small batches for a firm snap and a long, cocoa-forward finish.",
    story:
      "This is the bar we make to taste the bean. No vanilla, no emulsifier, no filler — just cocoa and sugar, worked slowly until the texture turns glossy.",
    ingredients: "Cocoa beans, sugar.",
    allergens:
      "No declared allergens in the recipe. Allergen declaration pending final verification before launch.",
    imageUrl: "/images/products/classic.jpg",
    hoverImageUrl: "/images/products/classic-detail.jpg",
    featured: true,
    position: 1,
    variants: [
      { name: "70 g bar", sku: "KC-C70-070", weightGrams: 70, priceMinor: 48000, stock: 42 },
      { name: "150 g bar", sku: "KC-C70-150", weightGrams: 150, priceMinor: 98000, stock: 18 },
    ],
  },
  {
    slug: "70-dark-chocolate-dry-fruits",
    name: "70% Dark Chocolate with Dry Fruits",
    collection: "DRY_FRUIT",
    tagline: "Cashews and pistachios, folded through dark chocolate.",
    cocoaPercent: 70,
    description:
      "Our 70% dark chocolate with toasted cashews and pistachios. The nuts are folded in at the end so the bar keeps its snap and the fruit stays crisp, not soft.",
    story:
      "We toast the cashews and pistachios separately, then fold them into the tempered chocolate by hand. Each batch is cut and wrapped the same day.",
    ingredients: "Cocoa beans, sugar, cashews, pistachios.",
    allergens: "Contains cashews and pistachios (tree nuts).",
    imageUrl: "/images/products/dryfruit.jpg",
    hoverImageUrl: "/images/products/dryfruit-detail.jpg",
    featured: true,
    position: 2,
    variants: [
      { name: "70 g bar", sku: "KC-DF70-070", weightGrams: 70, priceMinor: 54000, stock: 30 },
      { name: "150 g bar", sku: "KC-DF70-150", weightGrams: 150, priceMinor: 110000, stock: 12 },
    ],
  },
  {
    slug: "jaggery-sweetened-dark-chocolate",
    name: "Jaggery-Sweetened Dark Chocolate",
    collection: "JAGGERY",
    tagline: "Sweetened with jaggery. Deep, malty, warm.",
    cocoaPercent: null,
    description:
      "Dark chocolate sweetened with jaggery instead of refined sugar. Jaggery brings a warmer, rounder sweetness that sits behind the cocoa rather than on top of it.",
    story:
      "Jaggery is unrefined cane sugar, not a sugar-free sweetener. We use it because we like the flavour it gives the bar — molasses, dried fruit, a little smoke.",
    ingredients: "Cocoa beans, jaggery.",
    allergens:
      "No declared allergens in the recipe. Allergen declaration pending final verification before launch.",
    imageUrl: "/images/products/jaggery.jpg",
    hoverImageUrl: "/images/products/jaggery-detail.jpg",
    featured: true,
    position: 3,
    variants: [
      { name: "70 g bar", sku: "KC-JAG-070", weightGrams: 70, priceMinor: 52000, stock: 36 },
      { name: "150 g bar", sku: "KC-JAG-150", weightGrams: 150, priceMinor: 106000, stock: 14 },
    ],
  },
  {
    slug: "jaggery-dark-chocolate-dry-fruits",
    name: "Jaggery-Sweetened Dark Chocolate with Dry Fruits",
    collection: "JAGGERY_DRY_FRUIT",
    tagline: "Jaggery sweetness, cashew and pistachio crunch.",
    cocoaPercent: null,
    description:
      "Our jaggery-sweetened dark chocolate with toasted cashews and pistachios. Malty sweetness, a clean snap, and a generous nut crunch through every square.",
    story:
      "The same slow process as the plain jaggery bar, with the nuts added at the end. This is the richest bar in the collection and the one we make least often.",
    ingredients: "Cocoa beans, jaggery, cashews, pistachios.",
    allergens: "Contains cashews and pistachios (tree nuts).",
    imageUrl: "/images/products/jaggery-dryfruit-dark.jpg",
    hoverImageUrl: "/images/products/dryfruit-detail.jpg",
    featured: true,
    position: 4,
    variants: [
      { name: "70 g bar", sku: "KC-JDF-070", weightGrams: 70, priceMinor: 59000, stock: 24 },
      { name: "150 g bar", sku: "KC-JDF-150", weightGrams: 150, priceMinor: 120000, stock: 8 },
    ],
  },
];

const settings: Record<string, string> = {
  "store.name": "Kavya Chocolat",
  "store.tagline": "Premium handcrafted chocolate",
  "store.email": "hello@kavya.example",
  "store.phone": "+91 00000 00000",
  "store.address": "Studio address pending — add in Admin → Settings",
  "store.instagram": "https://instagram.com/",
  "store.currency": "INR",
  "store.freeShippingOver": "150000",
  "store.taxRateBp": "0",
  "store.taxLabel": "Tax (not configured)",
  "store.announcement": "Small-batch chocolate, made in India · Complimentary shipping over ₹1,500",
  "store.emailStatus": "not_configured",
  "store.lowStockThreshold": "6",
  "store.pickupNote":
    "Pickup is by arrangement. We will contact you to confirm a window before you travel.",
  "policy.shipping":
    "Orders are dispatched within 2–3 working days. Chocolate is packed with insulation and ice packs where the weather requires it. Delivery estimates are shown at checkout and are not guaranteed until a courier integration is configured.",
  "policy.returns":
    "Because chocolate is a perishable food, we cannot accept returns once an order has been delivered. If something arrives damaged or incorrect, contact us within 48 hours with a photograph and we will make it right.",
  "policy.privacy":
    "We collect only the details needed to fulfil your order: name, email, phone, and delivery or pickup information. We do not sell customer data. This policy is a placeholder and should be reviewed before launch.",
};

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@kavya.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const name = process.env.ADMIN_NAME ?? "Kavya Chocolat Owner";

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash: await bcrypt.hash(password, 12), role: "OWNER" },
  });

  for (const [key, value] of Object.entries(settings)) {
    await prisma.storeSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  if ((await prisma.pickupLocation.count()) === 0) {
    await prisma.pickupLocation.create({
      data: {
        name: "Kavya Chocolat Studio",
        addressLine: "Pickup address pending — add in Admin → Shipping",
        city: "Bengaluru",
        postalCode: "560001",
        phone: "+91 00000 00000",
        instructions:
          "Message us before you travel. Pickups are usually ready within 48 hours of your order. Bring your order number.",
        hours: "Tue–Sat, 10:00–18:00",
        active: true,
      },
    });
  }

  if ((await prisma.shippingZone.count()) === 0) {
    await prisma.shippingZone.createMany({
      data: [
        {
          name: "India",
          countries: JSON.stringify(["IN"]),
          feeMinor: 8000,
          freeOverMinor: 150000,
          minDays: 3,
          maxDays: 6,
          position: 1,
        },
        {
          name: "International",
          countries: JSON.stringify(["US", "GB", "CA", "AU", "AE", "SG", "DE", "FR"]),
          feeMinor: 180000,
          freeOverMinor: 0,
          minDays: 10,
          maxDays: 18,
          position: 2,
        },
      ],
    });
  }

  if ((await prisma.deliveryArea.count()) === 0) {
    await prisma.deliveryArea.create({
      data: {
        name: "Bengaluru city",
        postalCodes: JSON.stringify(["560*"]),
        feeMinor: 6000,
        minOrderMinor: 60000,
        schedule: "Tuesday to Saturday, 10:00–18:00",
        active: true,
      },
    });
  }

  for (const p of products) {
    const { variants, ...data } = p;
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: [
        { productId: product.id, url: data.imageUrl, alt: `${data.name} — placeholder image`, position: 0 },
        ...(data.hoverImageUrl
          ? [
              {
                productId: product.id,
                url: data.hoverImageUrl,
                alt: `${data.name} ingredients — placeholder image`,
                position: 1,
              },
            ]
          : []),
      ],
    });

    for (const v of variants) {
      await prisma.variant.upsert({
        where: { sku: v.sku },
        update: { ...v, productId: product.id },
        create: { ...v, productId: product.id },
      });
    }
  }

  console.log(`Seeded admin ${email}, ${products.length} products, settings, shipping and pickup.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

