"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, requireAdmin } from "@/lib/auth";
import { rupeesToMinor } from "@/lib/money";
import { addOrderNote, OrderError, updateOrderStatus, updateOrderTracking } from "@/lib/orders";
import {
  adminAreaSchema,
  adminOrderStatusSchema,
  adminPickupSchema,
  adminProductSchema,
  adminSettingsSchema,
  adminStockSchema,
  adminTrackingSchema,
  adminVariantSchema,
  adminZoneSchema,
  fieldErrorsFromZod,
  firstFieldError,
  isOrderStatus,
  passwordIssue,
} from "@/lib/validation";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function bool(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function integer(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function optionalInteger(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function uniqueMessage(error: unknown) {
  if ((error as { code?: string }).code === "P2002") {
    return "That slug, SKU or email is already in use.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = adminOrderStatusSchema.safeParse({
    orderId: text(formData, "orderId"),
    status: text(formData, "status"),
  });
  if (!parsed.success) fail("/admin/orders", firstFieldError(fieldErrorsFromZod(parsed.error)));

  const { orderId, status } = parsed.data;
  if (!isOrderStatus(status)) fail(`/admin/orders/${orderId}`, "Choose a valid status.");

  try {
    await updateOrderStatus(orderId, status, admin.email);
  } catch (error) {
    fail(
      `/admin/orders/${orderId}`,
      error instanceof OrderError ? error.message : "The status could not be updated.",
    );
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
  redirect(`/admin/orders/${orderId}?saved=status`);
}

export async function saveTrackingAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = adminTrackingSchema.safeParse({
    orderId: text(formData, "orderId"),
    courier: text(formData, "courier"),
    trackingNumber: text(formData, "trackingNumber"),
    trackingUrl: text(formData, "trackingUrl"),
  });
  if (!parsed.success) {
    const orderId = text(formData, "orderId");
    fail(
      orderId ? `/admin/orders/${orderId}` : "/admin/orders",
      firstFieldError(fieldErrorsFromZod(parsed.error)),
    );
  }

  const { orderId, courier, trackingNumber, trackingUrl } = parsed.data;

  try {
    await updateOrderTracking(
      orderId,
      {
        courier: courier ?? "",
        trackingNumber: trackingNumber ?? "",
        trackingUrl: trackingUrl ?? "",
      },
      admin.email,
    );
  } catch (error) {
    fail(`/admin/orders/${orderId}`, uniqueMessage(error));
  }

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=tracking`);
}

export async function addOrderNoteAction(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = text(formData, "orderId");
  const message = text(formData, "message");
  if (!orderId) fail("/admin/orders", "Order not found.");
  if (!message) fail(`/admin/orders/${orderId}`, "Write a note first.");
  if (message.length > 500) fail(`/admin/orders/${orderId}`, "Keep the note under 500 characters.");

  await addOrderNote(orderId, message, admin.email);
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=note`);
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const failPath = id ? `/admin/products/${id}` : "/admin/products/new";

  const parsed = adminProductSchema.safeParse({
    id,
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    collection: text(formData, "collection") || "CLASSIC",
    tagline: text(formData, "tagline"),
    description: text(formData, "description"),
    story: text(formData, "story"),
    ingredients: text(formData, "ingredients"),
    allergens: text(formData, "allergens"),
    cocoaPercent: optionalInteger(formData, "cocoaPercent") ?? undefined,
    imageUrl: text(formData, "imageUrl"),
    hoverImageUrl: text(formData, "hoverImageUrl"),
    position: integer(formData, "position", 0),
    featured: bool(formData, "featured"),
    published: bool(formData, "published"),
  });
  if (!parsed.success) {
    fail(failPath, firstFieldError(fieldErrorsFromZod(parsed.error)));
  }

  const parsedProduct = parsed.data;
  const slug = slugify(parsedProduct.slug || parsedProduct.name);
  if (!slug) fail(failPath, "Add a URL slug.");

  const data = {
    name: parsedProduct.name,
    slug,
    collection: parsedProduct.collection,
    tagline: parsedProduct.tagline ?? "",
    description: parsedProduct.description ?? "",
    story: parsedProduct.story ?? "",
    ingredients: parsedProduct.ingredients ?? "",
    allergens: parsedProduct.allergens ?? "",
    cocoaPercent: parsedProduct.cocoaPercent ?? null,
    imageUrl: parsedProduct.imageUrl || "/images/products/classic.jpg",
    hoverImageUrl: parsedProduct.hoverImageUrl || null,
    featured: Boolean(parsedProduct.featured),
    published: Boolean(parsedProduct.published),
    position: parsedProduct.position ?? 0,
  };

  let productId = id;

  try {
    if (id) {
      await prisma.product.update({ where: { id }, data });
    } else {
      const created = await prisma.product.create({ data });
      productId = created.id;
    }
  } catch (error) {
    fail(failPath, uniqueMessage(error));
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/products/${slug}`);
  redirect(`/admin/products/${productId}?saved=product`);
}

export async function setProductPublishedAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const published = bool(formData, "published");
  if (!id) fail("/admin/products", "Product not found.");

  const product = await prisma.product.update({
    where: { id },
    data: { published },
    select: { slug: true },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
  redirect(`/admin/products?saved=${published ? "published" : "unpublished"}`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  if (!id) fail("/admin/products", "Product not found.");

  const orderItems = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItems > 0) {
    fail(
      `/admin/products/${id}`,
      "This product appears on past orders. Archive it instead of deleting it.",
    );
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products?saved=deleted");
}

export async function saveVariantAction(formData: FormData) {
  await requireAdmin();
  const productId = text(formData, "productId");
  const variantId = text(formData, "variantId");
  if (!productId) fail("/admin/products", "Product not found.");
  const failPath = `/admin/products/${productId}`;

  const compareAtRaw = text(formData, "compareAt");
  const parsed = adminVariantSchema.safeParse({
    productId,
    variantId,
    name: text(formData, "name"),
    sku: text(formData, "sku").toUpperCase(),
    weightGrams: integer(formData, "weightGrams", 70),
    price: text(formData, "price"),
    compareAt: compareAtRaw ? compareAtRaw : undefined,
    lowStockThreshold: integer(formData, "lowStockThreshold", 6),
    stock: text(formData, "stock") ? integer(formData, "stock", 0) : undefined,
    active: bool(formData, "active"),
    shippingEligible: bool(formData, "shippingEligible"),
    internationalEligible: bool(formData, "internationalEligible"),
  });
  if (!parsed.success) {
    fail(failPath, firstFieldError(fieldErrorsFromZod(parsed.error)));
  }

  const input = parsed.data;
  const data = {
    name: input.name,
    sku: input.sku,
    weightGrams: input.weightGrams,
    priceMinor: rupeesToMinor(input.price),
    compareAtMinor: input.compareAt ? rupeesToMinor(input.compareAt) : null,
    lowStockThreshold: input.lowStockThreshold,
    active: Boolean(input.active),
    shippingEligible: Boolean(input.shippingEligible),
    internationalEligible: Boolean(input.internationalEligible),
    productId,
  };

  try {
    if (variantId) {
      await prisma.variant.update({ where: { id: variantId }, data });
    } else {
      const initialStock = Math.max(0, input.stock ?? 0);
      const variant = await prisma.variant.create({ data: { ...data, stock: initialStock } });
      if (initialStock > 0) {
        await prisma.inventoryMovement.create({
          data: {
            variantId: variant.id,
            productId,
            delta: initialStock,
            reason: "INITIAL",
            note: "Opening stock set in admin",
            stockAfter: initialStock,
          },
        });
      }
    }
  } catch (error) {
    fail(failPath, uniqueMessage(error));
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  redirect(`/admin/products/${productId}?saved=variant`);
}

export async function deactivateVariantAction(formData: FormData) {
  await requireAdmin();
  const productId = text(formData, "productId");
  const variantId = text(formData, "variantId");
  if (!productId || !variantId) fail("/admin/products", "Variant not found.");

  const activeCount = await prisma.variant.count({ where: { productId, active: true } });
  if (activeCount <= 1) {
    fail(`/admin/products/${productId}`, "A product needs at least one active variant.");
  }

  await prisma.variant.update({ where: { id: variantId }, data: { active: false } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  redirect(`/admin/products/${productId}?saved=variant-archived`);
}

export async function adjustStockAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = adminStockSchema.safeParse({
    variantId: text(formData, "variantId"),
    delta: text(formData, "delta"),
    reason: text(formData, "reason") || "CORRECTION",
    note: text(formData, "note"),
  });
  if (!parsed.success) {
    fail("/admin/inventory", firstFieldError(fieldErrorsFromZod(parsed.error)));
  }

  const { variantId, delta, reason, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const variant = await tx.variant.findUnique({ where: { id: variantId } });
      if (!variant) throw new Error("Variant not found.");
      const nextStock = variant.stock + delta;
      if (nextStock < 0) throw new Error("Stock cannot go below zero.");

      const updated = await tx.variant.update({
        where: { id: variantId },
        data: { stock: nextStock },
        select: { stock: true },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId,
          productId: variant.productId,
          delta,
          reason,
          note: note || `Manual ${reason.toLowerCase()} by ${admin.email}`,
          stockAfter: updated.stock,
        },
      });
    });
  } catch (error) {
    fail("/admin/inventory", uniqueMessage(error));
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect(`/admin/inventory?saved=${encodeURIComponent(variantId)}`);
}

export async function saveZoneAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const parsed = adminZoneSchema.safeParse({
    id,
    name: text(formData, "name"),
    countries: text(formData, "countries"),
    fee: text(formData, "fee") || "0",
    freeOver: text(formData, "freeOver") || "0",
    minDays: optionalInteger(formData, "minDays") ?? undefined,
    maxDays: optionalInteger(formData, "maxDays") ?? undefined,
    active: bool(formData, "active"),
    position: integer(formData, "position", 0),
  });
  if (!parsed.success) {
    fail("/admin/shipping", firstFieldError(fieldErrorsFromZod(parsed.error)));
  }

  const zone = parsed.data;
  const countries = zone.countries
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  const data = {
    name: zone.name,
    countries: JSON.stringify(countries),
    feeMinor: rupeesToMinor(zone.fee),
    freeOverMinor: rupeesToMinor(zone.freeOver),
    minDays: zone.minDays ?? null,
    maxDays: zone.maxDays ?? null,
    active: zone.active,
    position: zone.position,
  };

  try {
    if (id) await prisma.shippingZone.update({ where: { id }, data });
    else await prisma.shippingZone.create({ data });
  } catch (error) {
    fail("/admin/shipping", uniqueMessage(error));
  }

  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
  revalidatePath("/policies");
  redirect("/admin/shipping?saved=zone");
}

export async function savePickupAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const parsed = adminPickupSchema.safeParse({
    id,
    name: text(formData, "name"),
    addressLine: text(formData, "addressLine"),
    city: text(formData, "city"),
    postalCode: text(formData, "postalCode"),
    phone: text(formData, "phone"),
    instructions: text(formData, "instructions"),
    hours: text(formData, "hours"),
    active: bool(formData, "active"),
    position: integer(formData, "position", 0),
  });
  if (!parsed.success) {
    fail("/admin/shipping", firstFieldError(fieldErrorsFromZod(parsed.error)));
  }

  const pickup = parsed.data;
  const data = {
    name: pickup.name,
    addressLine: pickup.addressLine,
    city: pickup.city,
    postalCode: pickup.postalCode,
    phone: pickup.phone || null,
    instructions: pickup.instructions ?? "",
    hours: pickup.hours ?? "",
    active: pickup.active,
    position: pickup.position,
  };

  try {
    if (id) await prisma.pickupLocation.update({ where: { id }, data });
    else await prisma.pickupLocation.create({ data });
  } catch (error) {
    fail("/admin/shipping", uniqueMessage(error));
  }

  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
  revalidatePath("/policies");
  redirect("/admin/shipping?saved=pickup");
}

export async function saveAreaAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const parsed = adminAreaSchema.safeParse({
    id,
    name: text(formData, "name"),
    postalCodes: text(formData, "postalCodes"),
    fee: text(formData, "fee") || "0",
    minOrder: text(formData, "minOrder") || "0",
    schedule: text(formData, "schedule"),
    active: bool(formData, "active"),
    position: integer(formData, "position", 0),
  });
  if (!parsed.success) {
    fail("/admin/shipping", firstFieldError(fieldErrorsFromZod(parsed.error)));
  }

  const area = parsed.data;
  const postalCodes = area.postalCodes
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  const data = {
    name: area.name,
    postalCodes: JSON.stringify(postalCodes),
    feeMinor: rupeesToMinor(area.fee),
    minOrderMinor: rupeesToMinor(area.minOrder),
    schedule: area.schedule ?? "",
    active: area.active,
    position: area.position,
  };

  try {
    if (id) await prisma.deliveryArea.update({ where: { id }, data });
    else await prisma.deliveryArea.create({ data });
  } catch (error) {
    fail("/admin/shipping", uniqueMessage(error));
  }

  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
  revalidatePath("/policies");
  redirect("/admin/shipping?saved=area");
}

const settingKeys = [
  "store.name",
  "store.tagline",
  "store.email",
  "store.phone",
  "store.address",
  "store.instagram",
  "store.announcement",
  "store.lowStockThreshold",
  "store.pickupNote",
  "store.taxLabel",
  "policy.shipping",
  "policy.returns",
  "policy.privacy",
];

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();

  const raw: Record<string, string> = {};
  for (const key of settingKeys) {
    raw[key] = text(formData, key);
  }
  raw["store.freeShippingOver"] = text(formData, "store.freeShippingOver") || "0";
  raw["store.taxPercent"] = text(formData, "store.taxPercent") || "0";

  const parsed = adminSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    fail("/admin/settings", firstFieldError(fieldErrorsFromZod(parsed.error)));
  }

  const settings = parsed.data;
  const updates: Record<string, string> = {};
  for (const key of settingKeys) {
    if (key === "store.lowStockThreshold") continue;
    updates[key] = String(settings[key as keyof typeof settings] ?? "");
  }
  updates["store.lowStockThreshold"] = String(settings["store.lowStockThreshold"]);
  updates["store.freeShippingOver"] = String(rupeesToMinor(settings["store.freeShippingOver"]));
  updates["store.taxRateBp"] = String(
    Math.max(0, Math.round(settings["store.taxPercent"] * 100)),
  );

  for (const [key, value] of Object.entries(updates)) {
    await prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export async function changePasswordAction(formData: FormData) {
  const admin = await requireAdmin();
  const current = text(formData, "currentPassword");
  const next = text(formData, "newPassword");
  const confirm = text(formData, "confirmPassword");

  if (!current) fail("/admin/settings", "Enter your current password.");
  if (!(await bcrypt.compare(current, admin.passwordHash))) {
    fail("/admin/settings", "The current password is not correct.");
  }
  const passwordProblem = passwordIssue(next);
  if (passwordProblem) fail("/admin/settings", passwordProblem);
  if (next !== confirm) {
    fail("/admin/settings", "The new passwords do not match.");
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });

  // Rotate every session so old devices lose access, then sign this one back in.
  await prisma.session.deleteMany({ where: { adminId: admin.id } });
  await createSession(admin.id);

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=password");
}
