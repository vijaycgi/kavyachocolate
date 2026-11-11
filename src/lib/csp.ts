/**
 * Build the per-request Content-Security-Policy. `script-src` relies on a nonce
 * plus `'strict-dynamic'`; it must never fall back to `'unsafe-inline'`, which
 * would let injected inline scripts run and caps security-header grades at A.
 */
export function contentSecurityPolicy(
  nonce: string,
  isDev = process.env.NODE_ENV === "development",
) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
