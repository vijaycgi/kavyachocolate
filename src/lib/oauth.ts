import "server-only";

import { createHash, randomBytes } from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export function googleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function createOAuthState() {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { state, verifier, challenge };
}

export function googleRedirectUri(requestUrl: string) {
  return new URL("/api/auth/google/callback", requestUrl).toString();
}

export function googleAuthorizeUrl(input: {
  state: string;
  challenge: string;
  redirectUri: string;
}) {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!.trim());
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

export async function exchangeGoogleCode(input: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
      code_verifier: input.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = (await response.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!response.ok || !data.access_token) {
    console.error("Google token exchange failed", response.status, data.error ?? "");
    return { error: data.error ?? "token_exchange_failed" };
  }
  return data;
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

export async function fetchGoogleIdentity(accessToken: string): Promise<GoogleIdentity | null> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error("Google userinfo failed", response.status);
    return null;
  }
  const data = (await response.json().catch(() => null)) as
    | {
        sub?: string;
        email?: string;
        email_verified?: boolean | string;
        name?: string;
      }
    | null;
  if (!data?.sub || !data.email) return null;
  return {
    sub: data.sub,
    email: data.email.trim().toLowerCase(),
    emailVerified: data.email_verified === true || data.email_verified === "true",
    name: data.name?.trim() || data.email.split("@")[0],
  };
}
