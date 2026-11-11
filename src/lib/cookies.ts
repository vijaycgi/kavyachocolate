import "server-only";

import { headers } from "next/headers";

/**
 * A Secure cookie is dropped by the browser on plain http, which would make
 * sign-in fail silently on localhost, a LAN address, or any http-only staging
 * host. Decide from the request instead of assuming production means https.
 */
export async function cookieIsSecure() {
  if (process.env.NODE_ENV !== "production") return false;

  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";

  const host = (requestHeaders.get("host") ?? "").split(":")[0].trim().toLowerCase();
  const isLocalHost =
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

  return !isLocalHost;
}
