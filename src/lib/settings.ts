import { cache } from "react";
import { prisma } from "./db";

export const settingDefaults: Record<string, string> = {
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
  "store.announcement":
    "Small-batch chocolate, made in India · Complimentary shipping over ₹1,500",
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

export type StoreSettings = Record<string, string>;

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await prisma.storeSetting.findMany();
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...settingDefaults, ...stored };
});

export async function getSetting(key: string): Promise<string> {
  const settings = await getSettings();
  return settings[key] ?? "";
}

export function settingNumber(settings: StoreSettings, key: string, fallback = 0): number {
  const value = Number(settings[key]);
  return Number.isFinite(value) ? value : fallback;
}
