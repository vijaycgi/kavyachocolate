/**
 * Post-login redirect safety. Only internal paths under the expected prefix are
 * accepted; protocol-relative (`//evil.example`), absolute URLs and backslash
 * tricks all fall back to the section home page.
 *
 * Kept free of server-only imports so it can be unit tested directly.
 */
export function safeInternalPath(
  value: string | null | undefined,
  prefix: "/account" | "/admin",
  fallback: string,
) {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  // Reject control characters and whitespace that browsers may normalise.
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  if (value !== prefix && !value.startsWith(`${prefix}/`)) return fallback;
  return value;
}

export function safeAccountNext(value: string | null | undefined) {
  return safeInternalPath(value, "/account", "/account");
}

export function safeAdminNext(value: string | null | undefined) {
  return safeInternalPath(value, "/admin", "/admin");
}
