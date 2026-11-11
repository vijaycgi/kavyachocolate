import { z } from "zod";

/** Shared field-error shape for server actions and API responses. */
export type FieldErrors = Record<string, string>;

export function fieldErrorsFromZod(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function firstFieldError(errors: FieldErrors): string {
  return Object.values(errors)[0] ?? "Check the details and try again.";
}

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .toLowerCase()
  .email("Enter a valid email address.");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(90, "Keep your name under 90 characters.");

/**
 * Password policy: at least 10 characters, a letter, a number, and no more
 * than bcrypt's 72-byte limit. bcryptjs also silently truncates at 72 bytes,
 * so the maximum is part of the policy rather than an implementation detail.
 */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

const weakPasswords = new Set([
  "password12",
  "password123",
  "chocolate1",
  "qwerty1234",
  "letmein123",
  "admin12345",
]);

export function passwordIssue(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_LENGTH) {
    return `Keep the password under ${PASSWORD_MAX_LENGTH} bytes.`;
  }
  if (!/[A-Za-z]/.test(value)) return "Include at least one letter.";
  if (!/[0-9]/.test(value)) return "Include at least one number.";
  if (weakPasswords.has(value.toLowerCase())) return "Choose a less common password.";
  return null;
}

const passwordSchema = z
  .string()
  .min(1, "Choose a password.")
  .superRefine((value, ctx) => {
    const issue = passwordIssue(value);
    if (issue) ctx.addIssue({ code: "custom", message: issue });
  });

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Repeat your password."),
    acceptTerms: z
      .union([z.literal("on"), z.literal("true"), z.literal("1"), z.boolean()])
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "The passwords do not match.",
      });
    }
    if (!value.acceptTerms) {
      ctx.addIssue({
        code: "custom",
        path: ["acceptTerms"],
        message: "Accept the store policies to create an account.",
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "This reset link is incomplete.").max(200),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Repeat your password."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "The passwords do not match.",
      });
    }
  });

export const profileSchema = z.object({
  name: nameSchema,
  phone: z
    .string()
    .trim()
    .max(24, "That phone number is too long.")
    .regex(/^$|^[+0-9()\-\s]{7,24}$/, "Use digits, spaces, and + only.")
    .optional()
    .or(z.literal("")),
});

export const changeCustomerPasswordSchema = z
  .object({
    currentPassword: z.string().max(PASSWORD_MAX_LENGTH).optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Repeat your new password."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "The passwords do not match.",
      });
    }
  });

export const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().max(40, "Keep the label under 40 characters.").optional().or(z.literal("")),
  name: nameSchema,
  phone: z
    .string()
    .trim()
    .min(7, "Enter a contact phone for deliveries.")
    .max(24)
    .regex(/^[+0-9()\-\s]+$/, "Use digits, spaces, and + only."),
  line1: z.string().trim().min(3, "Enter the street address.").max(140),
  line2: z.string().trim().max(140).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().min(3, "Enter the postal code.").max(16),
  country: z.string().trim().length(2, "Choose a country.").toUpperCase(),
  isDefault: z.union([z.literal("on"), z.literal("true"), z.literal("1"), z.boolean()]).optional(),
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH),
});

export const adminProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Give the bar a name.").max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.")
    .optional()
    .or(z.literal("")),
  collection: z.enum(["CLASSIC", "DRY_FRUIT", "JAGGERY", "JAGGERY_DRY_FRUIT"]),
  tagline: z.string().trim().max(140).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  story: z.string().trim().max(4000).optional().or(z.literal("")),
  ingredients: z.string().trim().max(1000).optional().or(z.literal("")),
  allergens: z.string().trim().max(1000).optional().or(z.literal("")),
  cocoaPercent: z.coerce.number().int().min(0).max(100).optional().nullable(),
  imageUrl: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/(?!\/)/, "Use a local path beginning with /.")
    .optional()
    .or(z.literal("")),
  hoverImageUrl: z
    .string()
    .trim()
    .max(300)
    .regex(/^$|^\/(?!\/)/, "Use a local path beginning with /.")
    .optional()
    .or(z.literal("")),
  position: z.coerce.number().int().min(0).max(9999).optional(),
  published: z.union([z.literal("on"), z.boolean()]).optional(),
  featured: z.union([z.literal("on"), z.boolean()]).optional(),
});

export const adminVariantSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  name: z.string().trim().min(1, "A variant needs a name.").max(80),
  sku: z
    .string()
    .trim()
    .min(1, "Add a SKU.")
    .max(40)
    .regex(/^[A-Z0-9][A-Z0-9._-]*$/, "Use capital letters, numbers, dots or hyphens."),
  weightGrams: z.coerce.number().int().min(1).max(100000),
  price: z.coerce.number().positive("Enter a price above zero.").max(10000000),
  compareAt: z.coerce.number().positive().max(10000000).optional().nullable(),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000000),
  stock: z.coerce.number().int().min(0).max(1000000).optional(),
  active: z.union([z.literal("on"), z.boolean()]).optional(),
  shippingEligible: z.union([z.literal("on"), z.boolean()]).optional(),
  internationalEligible: z.union([z.literal("on"), z.boolean()]).optional(),
});

export const adminTrackingSchema = z.object({
  orderId: z.string().min(1),
  courier: z.string().trim().max(80).optional().or(z.literal("")),
  trackingNumber: z.string().trim().max(80).optional().or(z.literal("")),
  trackingUrl: z
    .string()
    .trim()
    .max(500)
    .regex(/^$|^https?:\/\//i, "Enter a full http(s) URL.")
    .optional()
    .or(z.literal("")),
});

export const adminStockSchema = z.object({
  variantId: z.string().min(1),
  delta: z.coerce.number().int().refine((value) => value !== 0, "Enter a non-zero adjustment."),
  reason: z.enum(["RESTOCK", "CORRECTION", "SAMPLE", "DAMAGE", "RETURN", "OTHER"]),
  note: z.string().trim().max(160).optional().or(z.literal("")),
});

export const adminOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order not found."),
  status: z.string().trim(),
});

export const adminZoneSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "Give the zone a name.").max(80),
    countries: z
      .string()
      .trim()
      .min(2, "Add at least one two-letter country code.")
      .max(400, "Keep the country list under 400 characters."),
    fee: z.coerce.number().min(0).max(10000000),
    freeOver: z.coerce.number().min(0).max(10000000),
    minDays: z.coerce.number().int().min(0).max(365).optional(),
    maxDays: z.coerce.number().int().min(0).max(365).optional(),
    active: z.boolean(),
    position: z.coerce.number().int().min(0).max(9999),
  })
  .superRefine((value, ctx) => {
    const codes = value.countries
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);
    if (codes.length === 0) {
      ctx.addIssue({ code: "custom", path: ["countries"], message: "Add at least one country code." });
    }
    if (codes.some((code) => !/^[A-Za-z]{2}$/.test(code))) {
      ctx.addIssue({
        code: "custom",
        path: ["countries"],
        message: "Use two-letter country codes separated by commas.",
      });
    }
    if (
      typeof value.minDays === "number" &&
      typeof value.maxDays === "number" &&
      value.maxDays < value.minDays
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxDays"],
        message: "The maximum days cannot be less than the minimum.",
      });
    }
  });

export const adminPickupSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Give the pickup location a name.").max(100),
  addressLine: z.string().trim().min(3, "Enter the pickup address.").max(160),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  postalCode: z.string().trim().min(3, "Enter the postal code.").max(16),
  phone: z
    .string()
    .trim()
    .max(24)
    .regex(/^$|^[+0-9()\-\s]{7,24}$/, "Use digits, spaces, and + only.")
    .optional()
    .or(z.literal("")),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  hours: z.string().trim().max(160).optional().or(z.literal("")),
  active: z.boolean(),
  position: z.coerce.number().int().min(0).max(9999),
});

export const adminAreaSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(2, "Give the delivery area a name.").max(80),
    postalCodes: z.string().trim().min(3, "Add at least one postal code.").max(2000),
    fee: z.coerce.number().min(0).max(10000000),
    minOrder: z.coerce.number().min(0).max(10000000),
    schedule: z.string().trim().max(200).optional().or(z.literal("")),
    active: z.boolean(),
    position: z.coerce.number().int().min(0).max(9999),
  })
  .superRefine((value, ctx) => {
    const codes = value.postalCodes
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);
    if (codes.length === 0) {
      ctx.addIssue({ code: "custom", path: ["postalCodes"], message: "Add at least one postal code." });
    }
    if (codes.some((code) => !/^[A-Za-z0-9][A-Za-z0-9 -]{2,15}$/.test(code))) {
      ctx.addIssue({
        code: "custom",
        path: ["postalCodes"],
        message: "Postal codes look invalid. Separate them with commas.",
      });
    }
  });

const settingText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const adminSettingsSchema = z.object({
  "store.name": settingText(80),
  "store.tagline": settingText(160),
  "store.email": z
    .string()
    .trim()
    .max(254)
    .regex(/^$|^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Enter a valid store email."),
  "store.phone": z
    .string()
    .trim()
    .max(24)
    .regex(/^$|^[+0-9()\-\s]{7,24}$/, "Use digits, spaces, and + only."),
  "store.address": settingText(300),
  "store.instagram": settingText(120),
  "store.announcement": settingText(200),
  "store.lowStockThreshold": z.coerce.number().int().min(0).max(100000),
  "store.pickupNote": settingText(500),
  "store.taxLabel": settingText(60),
  "policy.shipping": settingText(8000),
  "policy.returns": settingText(8000),
  "policy.privacy": settingText(8000),
  "store.freeShippingOver": z.coerce.number().min(0).max(10000000),
  "store.taxPercent": z.coerce.number().min(0, "Tax cannot be negative.").max(100, "Tax cannot exceed 100%."),
});

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
      .max(24, "That phone number is too long.")
      .regex(/^[+0-9()\-\s]+$/, "Use digits, spaces, and + only."),
    method: z.enum(["SHIP", "LOCAL", "PICKUP"]),
    notes: z.string().trim().max(500, "Keep the note under 500 characters.").optional().or(z.literal("")),
    pickupLocationId: z.string().optional().nullable(),
    address: z
      .object({
        line1: z.string().trim().max(140).optional().or(z.literal("")),
        line2: z.string().trim().max(140).optional().or(z.literal("")),
        city: z.string().trim().max(80).optional().or(z.literal("")),
        state: z.string().trim().max(80).optional().or(z.literal("")),
        postalCode: z.string().trim().max(16).optional().or(z.literal("")),
        country: z.string().trim().length(2, "Choose a country.").toUpperCase().optional().or(z.literal("")),
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
    if (!address?.line1 || address.line1.trim().length < 3) {
      ctx.addIssue({ code: "custom", path: ["address", "line1"], message: "Enter the street address." });
    }
    if (!address?.city || address.city.trim().length < 2) {
      ctx.addIssue({ code: "custom", path: ["address", "city"], message: "Enter the city." });
    }
    if (!address?.postalCode || address.postalCode.trim().length < 3) {
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
