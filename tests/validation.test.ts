import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addressSchema,
  adminAreaSchema,
  adminProductImageSchema,
  adminProductSchema,
  adminSettingsSchema,
  adminStockSchema,
  adminTrackingSchema,
  adminVariantSchema,
  checkoutSchema,
  fieldErrorsFromZod,
  firstFieldError,
  loginSchema,
  passwordIssue,
  registerSchema,
} from "../src/lib/validation";

const validCheckout = {
  idempotencyKey: "kc-unit-test-0001",
  name: "Asha Rao",
  email: "ASHA@Example.com",
  phone: "+91 98765 43210",
  method: "SHIP",
  notes: "",
  pickupLocationId: undefined,
  address: {
    line1: "12 Cocoa Lane",
    line2: "",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "in",
  },
  items: [{ variantId: "variant_1", quantity: 2 }],
} as const;

describe("password policy", () => {
  it("accepts a compliant password", () => {
    assert.equal(passwordIssue("cocoa-harbour-7"), null);
  });

  it("rejects short, letterless, numberless and common passwords", () => {
    assert.match(passwordIssue("short1") ?? "", /at least 10/i);
    assert.match(passwordIssue("1234567890") ?? "", /letter/i);
    assert.match(passwordIssue("onlyletters") ?? "", /number/i);
    assert.match(passwordIssue("password123") ?? "", /less common/i);
  });

  it("rejects passwords over bcrypt's 72-byte limit", () => {
    assert.match(passwordIssue("é".repeat(40)) ?? "", /72 bytes/i);
  });
});

describe("registerSchema", () => {
  it("accepts matching passwords and accepted policies", () => {
    const result = registerSchema.safeParse({
      name: "Asha Rao",
      email: " ASHA@example.com ",
      password: "cocoa-harbour-7",
      confirmPassword: "cocoa-harbour-7",
      acceptTerms: "on",
    });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.email, "asha@example.com");
  });

  it("reports mismatched passwords and missing policy acceptance", () => {
    const result = registerSchema.safeParse({
      name: "Asha Rao",
      email: "asha@example.com",
      password: "cocoa-harbour-7",
      confirmPassword: "cocoa-harbour-8",
    });
    assert.equal(result.success, false);
    if (!result.success) {
      const errors = fieldErrorsFromZod(result.error);
      assert.match(errors.confirmPassword ?? "", /do not match/i);
      assert.match(errors.acceptTerms ?? "", /accept/i);
    }
  });
});

describe("loginSchema", () => {
  it("normalises the email and rejects blank passwords", () => {
    const good = loginSchema.safeParse({ email: " Asha@Example.COM ", password: "x" });
    assert.equal(good.success, true);
    if (good.success) assert.equal(good.data.email, "asha@example.com");

    const blank = loginSchema.safeParse({ email: "asha@example.com", password: "" });
    assert.equal(blank.success, false);
  });
});

describe("checkoutSchema", () => {
  it("accepts a valid shipping order and lowercases the email", () => {
    const result = checkoutSchema.safeParse(validCheckout);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, "asha@example.com");
      assert.equal(result.data.address?.country, "IN");
    }
  });

  it("requires a pickup location for pickup orders", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      method: "PICKUP",
      route: undefined,
      address: undefined,
    });
    assert.equal(result.success, false);
    if (!result.success) {
      const errors = fieldErrorsFromZod(result.error);
      assert.match(errors.pickupLocationId ?? "", /pickup location/i);
    }
  });

  it("accepts pickup with a location", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      method: "PICKUP",
      pickupLocationId: "pickup_1",
      address: undefined,
    });
    assert.equal(result.success, true);
  });

  it("requires street, city, postal code and country for delivery", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      address: { line1: "", city: "", postalCode: "", country: "" },
    });
    assert.equal(result.success, false);
    if (!result.success) {
      const errors = fieldErrorsFromZod(result.error);
      assert.match(errors["address.line1"] ?? "", /street address/i);
      assert.match(errors["address.city"] ?? "", /city/i);
      assert.match(errors["address.postalCode"] ?? "", /postal code/i);
      assert.match(errors["address.country"] ?? "", /country/i);
    }
  });

  it("rejects an empty bag and long notes", () => {
    const empty = checkoutSchema.safeParse({ ...validCheckout, items: [] });
    assert.equal(empty.success, false);
    const longNote = checkoutSchema.safeParse({ ...validCheckout, notes: "x".repeat(501) });
    assert.equal(longNote.success, false);
  });
});

describe("addressSchema", () => {
  it("requires a real postal address and upper-cases the country", () => {
    const valid = addressSchema.safeParse({
      name: "Asha Rao",
      phone: "+91 98765 43210",
      line1: "12 Cocoa Lane",
      city: "Bengaluru",
      postalCode: "560001",
      country: "in",
    });
    assert.equal(valid.success, true);
    if (valid.success) assert.equal(valid.data.country, "IN");

    const invalid = addressSchema.safeParse({
      name: "A",
      phone: "1",
      line1: "",
      city: "",
      postalCode: "",
      country: "IND",
    });
    assert.equal(invalid.success, false);
  });
});

describe("admin schemas", () => {
  it("validates product slugs, collections and cocoa percentages", () => {
    const base = {
      name: "Dark bar",
      slug: "dark-bar",
      collection: "CLASSIC",
      position: 0,
    };
    assert.equal(adminProductSchema.safeParse(base).success, true);
    assert.equal(adminProductSchema.safeParse({ ...base, slug: "Dark Bar" }).success, false);
    assert.equal(adminProductSchema.safeParse({ ...base, collection: "OTHER" }).success, false);
    assert.equal(adminProductSchema.safeParse({ ...base, cocoaPercent: 101 }).success, false);
  });

  it("validates variant price, SKU and stock", () => {
    const base = {
      productId: "p1",
      name: "70g",
      sku: "KAV-70",
      weightGrams: 70,
      price: 480,
      lowStockThreshold: 6,
    };
    assert.equal(adminVariantSchema.safeParse(base).success, true);
    assert.equal(adminVariantSchema.safeParse({ ...base, price: 0 }).success, false);
    assert.equal(adminVariantSchema.safeParse({ ...base, sku: "kav-70" }).success, false);
    assert.equal(adminVariantSchema.safeParse({ ...base, stock: -1 }).success, false);
  });

  it("validates gallery image paths and alt text", () => {
    assert.equal(
      adminProductImageSchema.safeParse({
        productId: "p1",
        url: "/api/media/cmwbrpjom0000i608snsm1q1r",
        alt: "Bar close-up",
      }).success,
      true,
    );
    assert.equal(
      adminProductImageSchema.safeParse({
        productId: "p1",
        url: "https://example.com/bar.jpg",
      }).success,
      false,
    );
    assert.equal(
      adminProductImageSchema.safeParse({ productId: "p1", url: "" }).success,
      false,
    );
    assert.equal(
      adminProductImageSchema.safeParse({
        productId: "",
        url: "/api/media/abc",
      }).success,
      false,
    );
    assert.equal(
      adminProductImageSchema.safeParse({
        productId: "p1",
        url: "/api/media/abc",
        alt: "x".repeat(161),
      }).success,
      false,
    );
  });

  it("only allows http(s) tracking URLs", () => {
    assert.equal(
      adminTrackingSchema.safeParse({
        orderId: "o1",
        trackingUrl: "ftp://courier.example/track/1",
      }).success,
      false,
    );
    assert.equal(
      adminTrackingSchema.safeParse({
        orderId: "o1",
        trackingUrl: "https://courier.example/track/1",
      }).success,
      true,
    );
    assert.equal(
      adminTrackingSchema.safeParse({ orderId: "o1", trackingUrl: "javascript:alert(1)" }).success,
      false,
    );
  });

  it("rejects zero stock adjustments and unknown reasons", () => {
    assert.equal(
      adminStockSchema.safeParse({ variantId: "v1", delta: 0, reason: "RESTOCK" }).success,
      false,
    );
    assert.equal(
      adminStockSchema.safeParse({ variantId: "v1", delta: 2, reason: "WHATEVER" }).success,
      false,
    );
    assert.equal(
      adminStockSchema.safeParse({ variantId: "v1", delta: 2, reason: "RESTOCK" }).success,
      true,
    );
  });

  it("validates country codes and delivery-area postal codes", () => {
    assert.equal(
      adminAreaSchema.safeParse({
        name: "North",
        postalCodes: "560001, 560002",
        fee: 50,
        minOrder: 0,
        active: true,
        position: 0,
      }).success,
      true,
    );
    assert.equal(
      adminAreaSchema.safeParse({
        name: "North",
        postalCodes: "!!",
        fee: 50,
        minOrder: 0,
        active: true,
        position: 0,
      }).success,
      false,
    );
  });

  it("bounds store settings", () => {
    const base = {
      "store.name": "Kavya",
      "store.tagline": "",
      "store.email": "hello@kavya.example",
      "store.phone": "",
      "store.address": "",
      "store.instagram": "",
      "store.announcement": "",
      "store.lowStockThreshold": "6",
      "store.pickupNote": "",
      "store.taxLabel": "GST",
      "policy.shipping": "",
      "policy.returns": "",
      "policy.privacy": "",
      "store.freeShippingOver": "1500",
      "store.taxPercent": "5",
    };
    assert.equal(adminSettingsSchema.safeParse(base).success, true);
    assert.equal(
      adminSettingsSchema.safeParse({ ...base, "store.taxPercent": "101" }).success,
      false,
    );
    assert.equal(
      adminSettingsSchema.safeParse({ ...base, "store.email": "not-an-email" }).success,
      false,
    );
  });
});

describe("field error helpers", () => {
  it("keeps the first error per path and exposes a summary", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    assert.equal(result.success, false);
    if (!result.success) {
      const errors = fieldErrorsFromZod(result.error);
      assert.equal(Object.keys(errors).sort().join(","), "email,password");
      assert.match(firstFieldError(errors), /email address|password/i);
    }
  });
});
