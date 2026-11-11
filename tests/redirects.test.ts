import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeAccountNext, safeAdminNext } from "../src/lib/redirects";

describe("safeAccountNext", () => {
  it("keeps internal account paths", () => {
    assert.equal(safeAccountNext("/account"), "/account");
    assert.equal(safeAccountNext("/account/orders?page=2"), "/account/orders?page=2");
    assert.equal(safeAccountNext("/account/orders/cm123"), "/account/orders/cm123");
  });

  it("falls back for absent or non-account paths", () => {
    assert.equal(safeAccountNext(""), "/account");
    assert.equal(safeAccountNext(null), "/account");
    assert.equal(safeAccountNext("/admin"), "/account");
    assert.equal(safeAccountNext("/accounting"), "/account");
  });

  it("blocks open-redirect attempts", () => {
    assert.equal(safeAccountNext("//evil.example"), "/account");
    assert.equal(safeAccountNext("https://evil.example"), "/account");
    assert.equal(safeAccountNext("/\\evil.example"), "/account");
    assert.equal(safeAccountNext("/account\\..\\evil"), "/account");
    assert.equal(safeAccountNext("/account/\u0000evil"), "/account");
  });
});

describe("safeAdminNext", () => {
  it("keeps internal admin paths only", () => {
    assert.equal(safeAdminNext("/admin"), "/admin");
    assert.equal(safeAdminNext("/admin/orders?q=x"), "/admin/orders?q=x");
    assert.equal(safeAdminNext("/account"), "/admin");
    assert.equal(safeAdminNext("//evil.example/admin"), "/admin");
    assert.equal(safeAdminNext("javascript:alert(1)"), "/admin");
  });
});
