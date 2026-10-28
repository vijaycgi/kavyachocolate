import { z } from "zod";

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const checkoutSchema = z
  .object({
    idempotencyKey: z.string().min(12).max(120),
    name: z.string().trim().min(2, "Enter your full name.").max(90),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a phone number we can reach you on.")
      .max(24)
      .regex(/^[+0-9()\-\s]+$/, "Use digits, spaces, and + only."),
    method: z.enum(["SHIP", "LOCAL", "PICKUP"]),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    pickupLocationId: z.string().optional().nullable(),
    address: z
      .object({
        line1: z.string().trim().max(140).optional().or(z.literal("")),
        line2: z.string().trim().max(140).optional().or(z.literal("")),
        city: z.string().trim().max(80).optional().or(z.literal("")),
        state: z.string().trim().max(80).optional().or(z.literal("")),
        postalCode: z.string().trim().max(16).optional().or(z.literal("")),
        country: z.string().trim().length(2).optional().or(z.literal("")),
      })
      .optional(),
    items: z.array(cartItemSchema).min(1, "Your bag is empty.").max(20),
  })
  .superRefine((value, ctx) => {
    if (value.method === "PICKUP") {
      if (!value.pickupLocationId) {
        ctx.addIssue({
          code: "custom",
          path: ["pickupLocationId"],
          message: "Choose a pickup location.",
        });
      }
      return;
    }

    const address = value.address;
    if (!address?.line1) {
      ctx.addIssue({ code: "custom", path: ["address", "line1"], message: "Enter the street address." });
    }
    if (!address?.city) {
      ctx.addIssue({ code: "custom", path: ["address", "city"], message: "Enter the city." });
    }
    if (!address?.postalCode) {
      ctx.addIssue({
        code: "custom",
        path: ["address", "postalCode"],
        message: "Enter the postal code.",
      });
    }
    if (!address?.country || address.country.length !== 2) {
      ctx.addIssue({
        code: "custom",
        path: ["address", "country"],
        message: "Choose a country.",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderStatuses = [
  "PLACED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COLLECTED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const statusLabels: Record<OrderStatus, string> = {
  PLACED: "Placed",
  PROCESSING: "Processing",
  READY_FOR_PICKUP: "Ready for pickup",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
};

export const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP", "SHIPPED", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["COLLECTED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  COLLECTED: [],
  CANCELLED: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as readonly string[]).includes(value);
}
