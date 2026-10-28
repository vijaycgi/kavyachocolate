import "server-only";

import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getSettings } from "./settings";
import { quoteFulfillment } from "./fulfillment";
import {
  checkoutSchema,
  statusLabels,
  statusTransitions,
  type OrderStatus,
} from "./validation";

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const orderInclude = {
  items: { orderBy: { name: "asc" } },
  events: { orderBy: { createdAt: "desc" } },
  address: true,
  pickupLocation: true,
} satisfies Prisma.OrderInclude;

export type OrderWithDetail = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function generateOrderNumber() {
  const now = new Date();
  const stamp = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  return `KC-${stamp}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function generateAccessKey() {
  return randomBytes(18).toString("base64url");
}

export async function placeOrder(raw: unknown) {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new OrderError(first?.message ?? "Check the details and try again.");
  }

  const input = parsed.data;
  const settings = await getSettings();

  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return { orderNumber: existing.orderNumber, accessKey: existing.accessKey };
  }

  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
  }

  const variantIds = [...quantities.keys()];
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds }, active: true, product: { published: true } },
    include: { product: true },
  });
  if (variants.length !== variantIds.length) {
    throw new OrderError("One of the bars in your bag is no longer available. Refresh and try again.");
  }

  const country = (input.address?.country ?? "IN").toUpperCase();

  for (const variant of variants) {
    const quantity = quantities.get(variant.id) ?? 0;
    if (variant.stock < quantity) {
      throw new OrderError(
        `${variant.product.name} (${variant.name}) only has ${variant.stock} left. Adjust the quantity in your bag.`,
      );
    }
    if (input.method !== "PICKUP" && !variant.shippingEligible) {
      throw new OrderError(`${variant.product.name} cannot be shipped. Choose studio pickup.`);
    }
    if (input.method === "SHIP" && country !== "IN" && !variant.internationalEligible) {
      throw new OrderError(`${variant.product.name} is not available for international shipping.`);
    }
  }

  const lines = variants.map((variant) => {
    const quantity = quantities.get(variant.id) ?? 0;
    return {
      variant,
      quantity,
      lineTotalMinor: variant.priceMinor * quantity,
    };
  });

  const subtotalMinor = lines.reduce((total, line) => total + line.lineTotalMinor, 0);
  const quote = await quoteFulfillment({
    method: input.method,
    country,
    postalCode: input.address?.postalCode,
    subtotalMinor,
  });

  if (!quote.ok) throw new OrderError(quote.error);

  let pickupName: string | null = null;
  let pickupInstructions: string | null = null;
  if (input.method === "PICKUP") {
    const pickup = await prisma.pickupLocation.findFirst({
      where: { id: input.pickupLocationId ?? "", active: true },
    });
    if (!pickup) throw new OrderError("That pickup location is not available. Choose another.");
    pickupName = pickup.name;
    pickupInstructions = pickup.instructions;
  }

  const orderNumber = generateOrderNumber();
  const accessKey = generateAccessKey();
  const totalMinor = subtotalMinor + quote.feeMinor;
  const taxMinor = 0;

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        const duplicate = await tx.order.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (duplicate) return duplicate;

        const customer = await tx.customer.upsert({
          where: { email: input.email },
          update: { name: input.name, phone: input.phone },
          create: { email: input.email, name: input.name, phone: input.phone },
        });

        for (const line of lines) {
          const updated = await tx.variant.updateMany({
            where: { id: line.variant.id, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (updated.count === 0) {
            throw new OrderError(
              `${line.variant.product.name} (${line.variant.name}) just sold out. Adjust the quantity and try again.`,
            );
          }
        }

        const created = await tx.order.create({
          data: {
            orderNumber,
            accessKey,
            customerId: customer.id,
            email: input.email,
            name: input.name,
            phone: input.phone,
            status: "PLACED",
            fulfillmentMethod: input.method,
            currency: "INR",
            subtotalMinor,
            shippingMinor: quote.feeMinor,
            discountMinor: 0,
            taxMinor,
            totalMinor,
            taxLabel: settings["store.taxLabel"] ?? "Tax (not configured)",
            notes: input.notes || null,
            pickupLocationId: input.method === "PICKUP" ? input.pickupLocationId : null,
            pickupLocationName: pickupName,
            pickupInstructions,
            idempotencyKey: input.idempotencyKey,
            items: {
              create: lines.map((line) => ({
                productId: line.variant.productId,
                variantId: line.variant.id,
                name: line.variant.product.name,
                variantName: line.variant.name,
                sku: line.variant.sku,
                unitPriceMinor: line.variant.priceMinor,
                quantity: line.quantity,
                lineTotalMinor: line.lineTotalMinor,
                currency: "INR",
                taxRateBp: 0,
                imageUrl: line.variant.product.imageUrl,
              })),
            },
            events: {
              create: {
                type: "PLACED",
                message: "Order placed without online payment. Awaiting confirmation.",
                actor: "CUSTOMER",
              },
            },
            ...(input.method !== "PICKUP" && input.address
              ? {
                  address: {
                    create: {
                      name: input.name,
                      phone: input.phone,
                      line1: input.address.line1 ?? "",
                      line2: input.address.line2 || null,
                      city: input.address.city ?? "",
                      state: input.address.state || null,
                      postalCode: input.address.postalCode ?? "",
                      country,
                      kind: "SHIPPING",
                    },
                  },
                }
              : {}),
          },
        });

        for (const line of lines) {
          const after = await tx.variant.findUnique({
            where: { id: line.variant.id },
            select: { stock: true },
          });
          await tx.inventoryMovement.create({
            data: {
              variantId: line.variant.id,
              productId: line.variant.productId,
              delta: -line.quantity,
              reason: "ORDER",
              note: `Order ${orderNumber}`,
              orderId: created.id,
              stockAfter: after?.stock ?? 0,
            },
          });
        }

        return created;
      },
      { timeout: 15000 },
    );

    return { orderNumber: order.orderNumber, accessKey: order.accessKey };
  } catch (error) {
    if (error instanceof OrderError) throw error;
    // A concurrent retry may have won the idempotency race.
    const duplicate = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (duplicate) {
      return { orderNumber: duplicate.orderNumber, accessKey: duplicate.accessKey };
    }
    console.error("placeOrder failed", error);
    throw new OrderError("We could not place the order. Please try again.", 500);
  }
}

export async function getOrderByAccess(orderNumber: string, accessKey: string) {
  return prisma.order.findFirst({
    where: { orderNumber, accessKey },
    include: orderInclude,
  });
}

export async function getOrderForTracking(orderNumber: string, email: string) {
  return prisma.order.findFirst({
    where: {
      orderNumber: orderNumber.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
    },
    select: { orderNumber: true, accessKey: true },
  });
}

export async function updateOrderStatus(orderId: string, next: OrderStatus, actor: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new OrderError("Order not found.", 404);

  const current = order.status as OrderStatus;
  if (!statusTransitions[current]?.includes(next)) {
    throw new OrderError(`Cannot move an order from ${statusLabels[current]} to ${statusLabels[next]}.`);
  }

  await prisma.$transaction(async (tx) => {
    if (next === "CANCELLED") {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const variant = await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
          select: { stock: true, productId: true },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            productId: variant.productId,
            delta: item.quantity,
            reason: "CANCELLATION",
            note: `Stock restored from ${order.orderNumber}`,
            orderId: order.id,
            stockAfter: variant.stock,
          },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: next,
        ...(next === "CANCELLED" ? { cancelledAt: new Date() } : {}),
        ...(next === "SHIPPED" ? { shippedAt: new Date() } : {}),
        ...(next === "DELIVERED" || next === "COLLECTED" ? { completedAt: new Date() } : {}),
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId,
        type: next,
        actor,
        message:
          next === "CANCELLED"
            ? "Order cancelled. Stock restored to inventory."
            : `Order marked ${statusLabels[next].toLowerCase()}.`,
      },
    });
  });
}

export async function updateOrderTracking(
  orderId: string,
  data: { courier?: string; trackingNumber?: string; trackingUrl?: string },
  actor: string,
) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      courier: data.courier?.trim() || null,
      trackingNumber: data.trackingNumber?.trim() || null,
      trackingUrl: data.trackingUrl?.trim() || null,
    },
  });
  await prisma.orderEvent.create({
    data: {
      orderId,
      type: "TRACKING",
      actor,
      message: "Courier details updated.",
    },
  });
}

export async function addOrderNote(orderId: string, message: string, actor: string) {
  await prisma.orderEvent.create({
    data: { orderId, type: "NOTE", actor, message },
  });
}
