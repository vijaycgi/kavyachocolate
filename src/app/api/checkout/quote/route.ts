import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { quoteFulfillment } from "@/lib/fulfillment";

export const runtime = "nodejs";

const schema = z.object({
  method: z.enum(["SHIP", "LOCAL", "PICKUP"]),
  country: z.string().trim().max(2).optional(),
  postalCode: z.string().trim().max(16).optional(),
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.coerce.number().int().min(1).max(20) }))
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the bag and delivery details." }, { status: 400 });
  }

  const input = parsed.data;
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
  }

  const variants = await prisma.variant.findMany({
    where: {
      id: { in: [...quantities.keys()] },
      active: true,
      product: { published: true },
    },
    select: { id: true, priceMinor: true, stock: true },
  });

  if (variants.length !== quantities.size) {
    return NextResponse.json(
      { error: "One of the bars in your bag is no longer available." },
      { status: 409 },
    );
  }

  for (const variant of variants) {
    const quantity = quantities.get(variant.id) ?? 0;
    if (variant.stock < quantity) {
      return NextResponse.json(
        { error: "One of the bars in your bag has fewer units left than requested." },
        { status: 409 },
      );
    }
  }

  const subtotalMinor = variants.reduce(
    (total, variant) => total + variant.priceMinor * (quantities.get(variant.id) ?? 0),
    0,
  );

  const quote = await quoteFulfillment({
    method: input.method,
    country: input.country,
    postalCode: input.postalCode,
    subtotalMinor,
  });

  if (!quote.ok) {
    return NextResponse.json({ error: quote.error }, { status: 422 });
  }

  return NextResponse.json(
    {
      subtotalMinor,
      shippingMinor: quote.feeMinor,
      totalMinor: subtotalMinor + quote.feeMinor,
      label: quote.label,
      eta: quote.eta,
      freeOverMinor: quote.freeOverMinor,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
