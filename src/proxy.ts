import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/csp";

const ADMIN_SESSION_COOKIE = "kavya_admin_session";
const CUSTOMER_SESSION_COOKIE = "kavya_customer_session";

// Account pages that must stay reachable without a session. Everything else
// under /account requires a customer cookie. These checks are only an
// optimistic redirect: every page and action re-checks the session server-side.
const PUBLIC_ACCOUNT_PATHS = new Set([
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
  "/account/verify-email",
]);

function isPublicAccountPath(pathname: string) {
  const normalised = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
  return PUBLIC_ACCOUNT_PATHS.has(normalised);
}

/**
 * Attach a fresh per-request nonce to the CSP. Next.js reads the request-side
 * header and stamps its own scripts with the same nonce, so `script-src` no
 * longer needs `'unsafe-inline'`.
 */
function nextWithCsp(request: NextRequest, nonce: string) {
  const policy = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return nextWithCsp(request, nonce);

    if (!request.cookies.has(ADMIN_SESSION_COOKIE)) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(login);
    }

    return nextWithCsp(request, nonce);
  }

  if (pathname === "/account" || pathname.startsWith("/account/")) {
    if (!isPublicAccountPath(pathname) && !request.cookies.has(CUSTOMER_SESSION_COOKIE)) {
      const login = new URL("/account/login", request.url);
      login.searchParams.set("reason", "auth");
      login.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(login);
    }
  }

  return nextWithCsp(request, nonce);
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
