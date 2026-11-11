import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentSecurityPolicy } from "../src/lib/csp";

describe("contentSecurityPolicy", () => {
  it("uses a nonce and strict-dynamic instead of unsafe-inline for scripts", () => {
    const policy = contentSecurityPolicy("test-nonce", false);
    assert.match(policy, /script-src 'self' 'nonce-test-nonce' 'strict-dynamic'/);
    assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
  });

  it("allows eval and websockets only in development", () => {
    const dev = contentSecurityPolicy("n", true);
    assert.match(dev, /'unsafe-eval'/);
    assert.match(dev, /connect-src 'self' ws: wss:/);
    assert.doesNotMatch(dev, /upgrade-insecure-requests/);

    const prod = contentSecurityPolicy("n", false);
    assert.doesNotMatch(prod, /'unsafe-eval'/);
    assert.doesNotMatch(prod, /\bws:/);
    assert.match(prod, /upgrade-insecure-requests/);
  });

  it("locks down framing, objects, base URLs and forms", () => {
    const policy = contentSecurityPolicy("n", false);
    for (const directive of [
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ]) {
      assert.ok(policy.includes(directive), `missing ${directive}`);
    }
  });
});
