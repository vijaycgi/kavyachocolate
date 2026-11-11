import { NextResponse, type NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return NextResponse.next();

    if (!request.cookies.has(ADMIN_SESSION_COOKIE)) {
      const login = new URL("/admin/login", request.url);
      login.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(login);
    }

    return NextResponse.next();
  }

  if (pathname === "/account" || pathname.startsWith("/account/")) {
    if (isPublicAccountPath(pathname)) return NextResponse.next();

    if (!request.cookies.has(CUSTOMER_SESSION_COOKIE)) {
      const login = new URL("/account/login", request.url);
      login.searchParams.set("reason", "auth");
      login.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
