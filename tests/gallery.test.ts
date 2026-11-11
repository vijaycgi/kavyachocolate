import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProductGalleryImages, moveGalleryItem } from "../src/lib/gallery";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("moveGalleryItem", () => {
  it("moves an item up", () => {
    assert.deepEqual(
      moveGalleryItem(items, "b", "up").map((item) => item.id),
      ["b", "a", "c"],
    );
  });

  it("moves an item down", () => {
    assert.deepEqual(
      moveGalleryItem(items, "b", "down").map((item) => item.id),
      ["a", "c", "b"],
    );
  });

  it("does not move the first item up or the last item down", () => {
    assert.equal(moveGalleryItem(items, "a", "up"), items);
    assert.equal(moveGalleryItem(items, "c", "down"), items);
  });

  it("returns the original list for an unknown id", () => {
    assert.equal(moveGalleryItem(items, "missing", "up"), items);
  });

  it("does not mutate the input", () => {
    const copy = items.slice();
    moveGalleryItem(items, "a", "down");
    assert.deepEqual(items, copy);
  });
});

describe("buildProductGalleryImages", () => {
  const main = { id: "p1", url: "/images/products/classic.jpg", name: "Classic" };

  it("puts the main image first even when gallery rows exist", () => {
    const images = buildProductGalleryImages(main, [
      { id: "g1", url: "/images/products/classic-detail.jpg", alt: "detail" },
    ]);
    assert.deepEqual(
      images.map((image) => image.url),
      ["/images/products/classic.jpg", "/images/products/classic-detail.jpg"],
    );
  });

  it("keeps gallery order", () => {
    const images = buildProductGalleryImages(main, [
      { id: "g1", url: "/one.jpg", alt: "" },
      { id: "g2", url: "/two.jpg", alt: "" },
    ]);
    assert.deepEqual(
      images.map((image) => image.url),
      ["/images/products/classic.jpg", "/one.jpg", "/two.jpg"],
    );
  });

  it("removes duplicates of the main image and repeated gallery URLs", () => {
    const images = buildProductGalleryImages(main, [
      { id: "g1", url: "/images/products/classic.jpg", alt: "dup" },
      { id: "g2", url: "/one.jpg", alt: "" },
      { id: "g3", url: "/one.jpg", alt: "dup" },
    ]);
    assert.deepEqual(
      images.map((image) => image.url),
      ["/images/products/classic.jpg", "/one.jpg"],
    );
  });

  it("falls back to the main image when there is no gallery", () => {
    const images = buildProductGalleryImages(main, []);
    assert.equal(images.length, 1);
    assert.equal(images[0].url, main.url);
    assert.equal(images[0].alt, "Classic photograph");
  });
});
