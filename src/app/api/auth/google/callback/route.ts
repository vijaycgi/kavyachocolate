import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  attachGoogleToGuestCustomer,
  createCustomerSession,
  createGoogleCustomer,
  getCustomer,
  linkGoogleAccount,
} from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import {
  exchangeGoogleCode,
  fetchGoogleIdentity,
  googleOAuthConfigured,
} from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OAUTH_COOKIE = "kavya_google_oauth";

type OAuthContext = {
  state: string;
  verifier: string;
  redirectUri: string;
  link: boolean;
  customerId: string | null;
  at: number;
};

function redirectWith(request: NextRequest, path: string, key: string, value: string) {
  const url = new URL(path, request.url);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  if (!googleOAuthConfigured()) {
    return redirectWith(request, "/account/login", "oauth", "unconfigured");
  }

  const store = await cookies();
  const raw = store.get(OAUTH_COOKIE)?.value;
  store.delete(OAUTH_COOKIE);

  if (request.nextUrl.searchParams.get("error")) {
    return redirectWith(request, "/account/login", "oauth", "denied");
  }

  let context: OAuthContext;
  try {
    context = JSON.parse(raw ?? "") as OAuthContext;
  } catch {
    return redirectWith(request, "/account/login", "oauth", "error");
  }

  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  if (
    !context ||
    !code ||
    !state ||
    state !== context.state ||
    Date.now() - context.at > 10 * 60 * 1000
  ) {
    return redirectWith(request, "/account/login", "oauth", "error");
  }

  try {
    const tokens = await exchangeGoogleCode({
      code,
      verifier: context.verifier,
      redirectUri: context.redirectUri,
    });
    if (!tokens.access_token) {
      return redirectWith(request, "/account/login", "oauth", "error");
    }

    const identity = await fetchGoogleIdentity(tokens.access_token);
    if (!identity) {
      return redirectWith(request, "/account/login", "oauth", "error");
    }
    // Never link on an unverified provider email.
    if (!identity.emailVerified) {
      return redirectWith(request, "/account/login", "oauth", "unverified");
    }

    if (context.link) {
      const customer = await getCustomer();
      if (!customer || customer.id !== context.customerId) {
        return redirectWith(request, "/account/login", "reason", "session");
      }
      const existing = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: identity.sub,
          },
        },
        select: { customerId: true },
      });
      if (existing && existing.customerId !== customer.id) {
        return redirectWith(request, "/account/security", "error", "That Google account is linked to another customer.");
      }
      if (!existing) {
        const already = await prisma.oAuthAccount.findFirst({
          where: { customerId: customer.id, provider: "google" },
        });
        if (already) {
          return redirectWith(request, "/account/security", "saved", "google-already");
        }
        await linkGoogleAccount(customer.id, identity.sub);
      }
      return redirectWith(request, "/account/security", "saved", "google");
    }

    const linked = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: identity.sub,
        },
      },
      include: { customer: true },
    });
    if (linked) {
      await createCustomerSession(linked.customerId);
      return redirectWith(request, "/account", "welcome", "1");
    }

    const existing = await prisma.customer.findUnique({
      where: { email: identity.email },
      include: { oauthAccounts: { select: { id: true } } },
    });

    if (existing) {
      // A password account must be signed in with its password before a
      // provider can be linked. This prevents email-only account takeover.
      if (existing.passwordHash) {
        return redirectWith(request, "/account/login", "oauth", "link-required");
      }
      if (existing.oauthAccounts.length > 0) {
        return redirectWith(request, "/account/login", "oauth", "conflict");
      }
      await attachGoogleToGuestCustomer(existing, identity.sub);
      await createCustomerSession(existing.id);
      return redirectWith(request, "/account", "welcome", "1");
    }

    try {
      const customer = await createGoogleCustomer({
        email: identity.email,
        name: identity.name,
        providerAccountId: identity.sub,
      });
      await createCustomerSession(customer.id);
      return redirectWith(request, "/account", "welcome", "1");
    } catch (error) {
      // A concurrent callback may have created the row first.
      if ((error as { code?: string }).code === "P2002") {
        const raced = await prisma.oAuthAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: identity.sub,
            },
          },
          include: { customer: true },
        });
        if (raced) {
          await createCustomerSession(raced.customerId);
          return redirectWith(request, "/account", "welcome", "1");
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Google callback failed", error);
    return redirectWith(request, "/account/login", "oauth", "error");
  }
}
