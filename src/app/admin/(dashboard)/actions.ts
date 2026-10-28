"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, requireAdmin } from "@/lib/auth";
import { rupeesToMinor } from "@/lib/money";
import { addOrderNote, OrderError, updateOrderStatus, updateOrderTracking } from "@/lib/orders";
import { isOrderStatus } from "@/lib/validation";

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
  const orderId = text(formData, "orderId");
  const status = text(formData, "status");

  if (!orderId || !isOrderStatus(status)) fail(`/admin/orders/${orderId}`, "Choose a valid status.");

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
  const orderId = text(formData, "orderId");
  if (!orderId) fail("/admin/orders", "Order not found.");

  try {
    await updateOrderTracking(
      orderId,
      {
        courier: text(formData, "courier"),
        trackingNumber: text(formData, "trackingNumber"),
        trackingUrl: text(formData, "trackingUrl"),
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
  if (!orderId || !message) fail(`/admin/orders/${orderId}`, "Write a note first.");

  await addOrderNote(orderId, message.slice(0, 500), admin.email);
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?saved=note`);
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!name) fail(id ? `/admin/products/${id}` : "/admin/products/new", "Give the bar a name.");

  const slug = slugify(text(formData, "slug") || name);
  if (!slug) fail(id ? `/admin/products/${id}` : "/admin/products/new", "Add a URL slug.");

  const data = {
    name,
    slug,
    collection: text(formData, "collection") || "CLASSIC",
    tagline: text(formData, "tagline"),
    description: text(formData, "description"),
    story: text(formData, "story"),
    ingredients: text(formData, "ingredients"),
    allergens: text(formData, "allergens"),
    cocoaPercent: optionalInteger(formData, "cocoaPercent"),
    imageUrl: text(formData, "imageUrl") || "/images/products/classic.jpg",
    hoverImageUrl: text(formData, "hoverImageUrl") || null,
    featured: bool(formData, "featured"),
    published: bool(formData, "published"),
    position: integer(formData, "position", 0),
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
    fail(
      id ? `/admin/products/${id}` : "/admin/products/new",
      uniqueMessage(error),
    );
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

  const name = text(formData, "name");
  const sku = text(formData, "sku").toUpperCase();
  if (!name || !sku) fail(`/admin/products/${productId}`, "A variant needs a name and SKU.");

  const priceMinor = rupeesToMinor(text(formData, "price"));
  if (priceMinor <= 0) fail(`/admin/products/${productId}`, "Enter a price above zero.");

  const compareAt = text(formData, "compareAt");

  const data = {
    name,
    sku,
    weightGrams: Math.max(1, integer(formData, "weightGrams", 70)),
    priceMinor,
    compareAtMinor: compareAt ? rupeesToMinor(compareAt) : null,
    lowStockThreshold: Math.max(0, integer(formData, "lowStockThreshold", 6)),
    active: bool(formData, "active"),
    shippingEligible: bool(formData, "shippingEligible"),
    internationalEligible: bool(formData, "internationalEligible"),
    productId,
  };

  try {
    if (variantId) {
      await prisma.variant.update({ where: { id: variantId }, data });
    } else {
      const initialStock = Math.max(0, integer(formData, "stock", 0));
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
    fail(`/admin/products/${productId}`, uniqueMessage(error));
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
  const variantId = text(formData, "variantId");
  const delta = integer(formData, "delta", 0);
  const reason = text(formData, "reason") || "CORRECTION";
  const note = text(formData, "note");
  if (!variantId || delta === 0) fail("/admin/inventory", "Enter a non-zero adjustment.");

  const allowed = ["RESTOCK", "CORRECTION", "SAMPLE", "DAMAGE", "RETURN", "OTHER"];
  if (!allowed.includes(reason)) fail("/admin/inventory", "Choose a valid reason.");

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
  const name = text(formData, "name");
  if (!name) fail("/admin/shipping", "Give the zone a name.");

  const countries = text(formData, "countries")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  const data = {
    name,
    countries: JSON.stringify(countries),
    feeMinor: rupeesToMinor(text(formData, "fee")),
    freeOverMinor: rupeesToMinor(text(formData, "freeOver")),
    minDays: optionalInteger(formData, "minDays"),
    maxDays: optionalInteger(formData, "maxDays"),
    active: bool(formData, "active"),
    position: integer(formData, "position", 0),
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
  const name = text(formData, "name");
  if (!name) fail("/admin/shipping", "Give the pickup location a name.");

  const data = {
    name,
    addressLine: text(formData, "addressLine"),
    city: text(formData, "city"),
    postalCode: text(formData, "postalCode"),
    phone: text(formData, "phone") || null,
    instructions: text(formData, "instructions"),
    hours: text(formData, "hours"),
    active: bool(formData, "active"),
    position: integer(formData, "position", 0),
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
  const name = text(formData, "name");
  if (!name) fail("/admin/shipping", "Give the delivery area a name.");

  const postalCodes = text(formData, "postalCodes")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  const data = {
    name,
    postalCodes: JSON.stringify(postalCodes),
    feeMinor: rupeesToMinor(text(formData, "fee")),
    minOrderMinor: rupeesToMinor(text(formData, "minOrder")),
    schedule: text(formData, "schedule"),
    active: bool(formData, "active"),
    position: integer(formData, "position", 0),
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

  const updates: Record<string, string> = {};
  for (const key of settingKeys) {
    updates[key] = text(formData, key);
  }
  updates["store.freeShippingOver"] = String(
    rupeesToMinor(text(formData, "store.freeShippingOver")),
  );
  const taxPercent = Number.parseFloat(text(formData, "store.taxPercent") || "0");
  updates["store.taxRateBp"] = String(
    Number.isFinite(taxPercent) ? Math.max(0, Math.round(taxPercent * 100)) : 0,
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

  if (!(await bcrypt.compare(current, admin.passwordHash))) {
    fail("/admin/settings", "The current password is not correct.");
  }
  if (next.length < 10) {
    fail("/admin/settings", "Use at least 10 characters for the new password.");
  }
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
