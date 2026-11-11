import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_IMAGE_EDGE,
  MAX_IMAGE_UPLOAD_BYTES,
  formatFileSize,
  imageMimeTypeAllowed,
  mediaUrl,
  sanitizeFilename,
} from "../src/lib/media";

describe("media limits", () => {
  it("stays below Vercel's 4.5 MB request body ceiling", () => {
    assert.ok(MAX_IMAGE_UPLOAD_BYTES > 0);
    assert.ok(MAX_IMAGE_UPLOAD_BYTES < 4.5 * 1024 * 1024);
  });

  it("caps stored images at a sensible long edge", () => {
    assert.equal(MAX_IMAGE_EDGE, 2000);
  });
});

describe("imageMimeTypeAllowed", () => {
  it("accepts the formats sharp re-encodes", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif"]) {
      assert.equal(imageMimeTypeAllowed(type), true, type);
    }
  });

  it("accepts an untyped drag-and-drop file so the server can sniff it", () => {
    assert.equal(imageMimeTypeAllowed(""), true);
  });

  it("rejects non-image and unknown image types", () => {
    assert.equal(imageMimeTypeAllowed("application/pdf"), false);
    assert.equal(imageMimeTypeAllowed("image/gif"), false);
    assert.equal(imageMimeTypeAllowed("image/svg+xml"), false);
  });

  it("is case-insensitive", () => {
    assert.equal(imageMimeTypeAllowed("IMAGE/PNG"), true);
  });
});

describe("mediaUrl", () => {
  it("returns a same-origin local path", () => {
    assert.equal(mediaUrl("clx000000000000000000000"), "/api/media/clx000000000000000000000");
  });
});

describe("sanitizeFilename", () => {
  it("strips directories and forces a webp extension", () => {
    assert.equal(sanitizeFilename("C:\\Users\\kavya\\bar photo.JPG"), "bar photo.webp");
    assert.equal(sanitizeFilename("/tmp/cocoa-70%.png"), "cocoa-70.webp");
  });

  it("falls back to a safe name", () => {
    assert.equal(sanitizeFilename(""), "image.webp");
    assert.equal(sanitizeFilename("..."), "image.webp");
    assert.equal(sanitizeFilename(".jpg"), "image.webp");
    assert.equal(sanitizeFilename("कक्षा.jpg"), "image.webp");
  });

  it("limits the stored name length", () => {
    const long = "a".repeat(400) + ".jpg";
    assert.ok(sanitizeFilename(long).length <= 101);
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes and megabytes", () => {
    assert.equal(formatFileSize(512), "512 B");
    assert.equal(formatFileSize(2048), "2 KB");
    assert.equal(formatFileSize(1.5 * 1024 * 1024), "1.5 MB");
    assert.equal(formatFileSize(12 * 1024 * 1024), "12 MB");
  });
});
