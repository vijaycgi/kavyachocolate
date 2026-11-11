import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { cookieIsSecure } from "@/lib/cookies";
import { getCustomer } from "@/lib/customer-auth";
import {
  createOAuthState,
  googleAuthorizeUrl,
  googleOAuthConfigured,
  googleRedirectUri,
} from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OAUTH_COOKIE = "kavya_google_oauth";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/account/login", request.url);
  if (!googleOAuthConfigured()) {
    loginUrl.searchParams.set("oauth", "unconfigured");
    return NextResponse.redirect(loginUrl);
  }

  const linkMode = request.nextUrl.searchParams.get("link") === "1";
  let customerId: string | null = null;

  if (linkMode) {
    const customer = await getCustomer();
    if (!customer) {
      loginUrl.searchParams.set("reason", "session");
      loginUrl.searchParams.set("next", "/account/security");
      return NextResponse.redirect(loginUrl);
    }
    customerId = customer.id;
  }

  const { state, verifier, challenge } = createOAuthState();
  const redirectUri = googleRedirectUri(request.url);

  (await cookies()).set(
    OAUTH_COOKIE,
    JSON.stringify({ state, verifier, redirectUri, link: linkMode, customerId, at: Date.now() }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: await cookieIsSecure(),
      path: "/",
      maxAge: 10 * 60,
    },
  );

  return NextResponse.redirect(
    googleAuthorizeUrl({ state, challenge, redirectUri }),
  );
}
