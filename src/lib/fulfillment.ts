import { prisma } from "./db";
import { getSettings, settingNumber } from "./settings";

export type FulfillmentMethod = "SHIP" | "LOCAL" | "PICKUP";

export const fulfillmentLabels: Record<FulfillmentMethod, string> = {
  SHIP: "Courier shipping",
  LOCAL: "Local delivery",
  PICKUP: "Studio pickup",
};

export type FulfillmentQuote =
  | {
      ok: true;
      method: FulfillmentMethod;
      feeMinor: number;
      freeOverMinor: number;
      label: string;
      eta: string;
    }
  | { ok: false; error: string };

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function postalMatches(postalCode: string, patterns: string[]) {
  const code = postalCode.trim().toUpperCase();
  return patterns.some((pattern) => {
    const clean = pattern.trim().toUpperCase();
    if (!clean) return false;
    if (clean.endsWith("*")) return code.startsWith(clean.slice(0, -1));
    if (clean.includes("-")) {
      const [start, end] = clean.split("-");
      return code >= start && code <= end;
    }
    return code === clean;
  });
}

export async function getFulfillmentOptions() {
  const [zones, areas, pickups] = await Promise.all([
    prisma.shippingZone.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.deliveryArea.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.pickupLocation.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
  ]);

  const countries = new Set<string>();
  for (const zone of zones) {
    for (const country of parseList(zone.countries)) countries.add(country);
  }
  if (areas.length > 0) countries.add("IN");

  const regionNames =
    typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames(["en"], { type: "region" })
      : null;

  return {
    zones: zones.map((zone) => ({
      ...zone,
      countryList: parseList(zone.countries),
    })),
    areas: areas.map((area) => ({
      ...area,
      postalList: parseList(area.postalCodes),
    })),
    pickups,
    countries: [...countries]
      .map((code) => ({ code, name: regionNames?.of(code) ?? code }))
      .sort((a, b) => (a.code === "IN" ? -1 : b.code === "IN" ? 1 : a.name.localeCompare(b.name))),
  };
}

export async function quoteFulfillment(input: {
  method: FulfillmentMethod;
  country?: string;
  postalCode?: string;
  subtotalMinor: number;
}): Promise<FulfillmentQuote> {
  const settings = await getSettings();

  if (input.method === "PICKUP") {
    return {
      ok: true,
      method: "PICKUP",
      feeMinor: 0,
      freeOverMinor: 0,
      label: "Studio pickup",
      eta: "Usually ready within 48 hours",
    };
  }

  const country = (input.country ?? "").trim().toUpperCase();
  const postalCode = (input.postalCode ?? "").trim();

  if (!country) return { ok: false, error: "Choose a delivery country." };

  if (input.method === "LOCAL") {
    if (country !== "IN") {
      return { ok: false, error: "Local delivery is only available within India." };
    }
    if (!postalCode) {
      return { ok: false, error: "Enter a postal code to check local delivery." };
    }

    const areas = await prisma.deliveryArea.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
    });
    const area = areas.find((candidate) =>
      postalMatches(postalCode, parseList(candidate.postalCodes)),
    );

    if (!area) {
      return {
        ok: false,
        error: "Local delivery is not available for that postal code. Choose courier shipping or studio pickup.",
      };
    }
    if (input.subtotalMinor < area.minOrderMinor) {
      return {
        ok: false,
        error: `Local delivery starts at an order value of ${(area.minOrderMinor / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}.`,
      };
    }

    const threshold = settingNumber(settings, "store.freeShippingOver", 0);
    const fee = threshold > 0 && input.subtotalMinor >= threshold ? 0 : area.feeMinor;

    return {
      ok: true,
      method: "LOCAL",
      feeMinor: fee,
      freeOverMinor: threshold,
      label: `Local delivery · ${area.name}`,
      eta: area.schedule || "Hand-delivered by arrangement",
    };
  }

  const zones = await prisma.shippingZone.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });
  const zone = zones.find((candidate) => parseList(candidate.countries).includes(country));

  if (!zone) {
    return {
      ok: false,
      error: "We do not ship to that country yet. Choose studio pickup if you can collect in person.",
    };
  }

  if (!postalCode) {
    return { ok: false, error: "Enter a postal code for the delivery estimate." };
  }

  const fee = zone.freeOverMinor > 0 && input.subtotalMinor >= zone.freeOverMinor ? 0 : zone.feeMinor;
  const eta =
    zone.minDays && zone.maxDays
      ? `Estimated ${zone.minDays}–${zone.maxDays} working days after dispatch`
      : "Delivery estimate confirmed after dispatch";

  return {
    ok: true,
    method: "SHIP",
    feeMinor: fee,
    freeOverMinor: zone.freeOverMinor,
    label: `Courier shipping · ${zone.name}`,
    eta,
  };
}
