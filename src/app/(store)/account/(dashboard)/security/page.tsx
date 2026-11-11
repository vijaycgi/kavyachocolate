import Link from "next/link";
import { cookies } from "next/headers";
import { AlertTriangle, Check, Globe2, ShieldCheck } from "lucide-react";
import {
  unlinkGoogleAction,
  revokeOtherSessionsAction,
} from "@/app/(store)/account/actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { GoogleButton } from "@/components/account/google-button";
import { PasswordForm } from "@/components/account/password-form";
import { ResendVerificationForm } from "@/components/account/resend-verification-form";
import {
  CUSTOMER_SESSION_COOKIE,
  hashCustomerToken,
  requireCustomer,
} from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/money";
import { googleOAuthConfigured } from "@/lib/oauth";

type Search = { saved?: string; error?: string };

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [params, customer, store] = await Promise.all([
    searchParams,
    requireCustomer(),
    cookies(),
  ]);
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value ?? "";
  const currentHash = token ? hashCustomerToken(token) : "";

  const [oauthAccounts, sessions] = await Promise.all([
    prisma.oAuthAccount.findMany({
      where: { customerId: customer.id },
      select: { id: true, provider: true, createdAt: true },
    }),
    prisma.customerSession.findMany({
      where: { customerId: customer.id },
      orderBy: { lastUsedAt: "desc" },
      take: 10,
      select: { id: true, tokenHash: true, createdAt: true, lastUsedAt: true, expiresAt: true },
    }),
  ]);
  const googleLinked = oauthAccounts.some((account) => account.provider === "google");
  const savedMessage =
    params.saved === "sessions"
      ? "Other sessions have been signed out."
      : params.saved === "unlinked"
        ? "Google sign-in has been unlinked."
        : params.saved === "google"
          ? "Google sign-in is now linked."
          : params.saved === "google-already"
            ? "Google is already linked to this account."
            : params.saved
              ? "Security settings saved."
              : "";

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="font-display text-2xl">Password &amp; security</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          Manage the password, email verification, linked sign-in methods and active sessions.
        </p>
      </div>

      {savedMessage ? (
        <p role="status" className="border border-[#4f6144]/35 bg-[#4f6144]/10 px-4 py-3 text-[12.5px] text-[#3c4b33]">
          {savedMessage}
        </p>
      ) : null}
      {params.error ? (
        <p role="alert" className="border border-burgundy/35 bg-burgundy/5 px-4 py-3 text-[12.5px] text-burgundy">
          {params.error}
        </p>
      ) : null}

      <section className="border border-line bg-cream p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
            Password
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-ink-2">
            <ShieldCheck size={12} aria-hidden /> Hashed with bcrypt
          </span>
        </div>
        <div className="mt-4">
          <PasswordForm hasPassword={Boolean(customer.passwordHash)} />
        </div>
      </section>

      <section className="border border-line bg-cream p-4 sm:p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
          Email verification
        </h3>
        <div className="mt-3 flex items-start gap-3">
          {customer.emailVerifiedAt ? (
            <>
              <Check size={16} className="mt-0.5 shrink-0 text-[#4f6144]" aria-hidden />
              <div>
                <p className="text-[12.5px] text-ink">{customer.email} is verified.</p>
                <p className="mt-1 text-[11.5px] text-ink-2">
                  Verified {formatDateTime(customer.emailVerifiedAt)}. Guest orders from this
                  address are linked to the account.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-brass-ink" aria-hidden />
              <div className="min-w-0">
                <p className="text-[12.5px] text-ink">{customer.email} is not verified yet.</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">
                  Verification links earlier guest orders to this account. Your account and orders
                  placed while signed in still work.
                </p>
                <div className="mt-3">
                  <ResendVerificationForm />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="border border-line bg-cream p-4 sm:p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
          Sign-in methods
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-[12.5px] text-ink">
              <Globe2 size={14} aria-hidden /> Google
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">
              {googleLinked
                ? "Linked. You can sign in with Google or your password."
                : "Not linked. Linking requires a verified Google email and an existing signed-in session."}
            </p>
          </div>
          {googleLinked ? (
            <form action={unlinkGoogleAction}>
              <input type="hidden" name="provider" value="google" />
              <ConfirmSubmit
                className="btn btn-outline btn-sm"
                message="Unlink Google from this account? You will need your password to sign in."
              >
                Unlink Google
              </ConfirmSubmit>
            </form>
          ) : (
            <GoogleButton configured={googleOAuthConfigured()} label="Link Google" link />
          )}
        </div>
      </section>

      <section className="border border-line bg-cream p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
            Active sessions
          </h3>
          <span className="text-[10px] text-ink-2">Last 10</span>
        </div>
        <ul className="divide-y divide-line/70">
          {sessions.map((session) => {
            const current = session.tokenHash === currentHash;
            return (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[11.5px]">
                <div>
                  <p className="text-ink">
                    {current ? "This browser" : "Another signed-in browser"}
                  </p>
                  <p className="text-[10.5px] text-ink-2">
                    Last used {formatDateTime(session.lastUsedAt)} · expires {formatDateTime(session.expiresAt)}
                  </p>
                </div>
                {current ? (
                  <span className="tag border-[#4f6144]/35 text-[#3c4b33]">Current</span>
                ) : null}
              </li>
            );
          })}
        </ul>
        <form action={revokeOtherSessionsAction} className="mt-4 border-t border-line pt-4">
          <ConfirmSubmit
            className="btn btn-outline btn-sm"
            message="Sign out every other browser? This browser stays signed in."
          >
            Sign out other sessions
          </ConfirmSubmit>
        </form>
      </section>

      <p className="text-[11px] leading-relaxed text-ink-2">
        Sessions are random 256-bit tokens stored as SHA-256 hashes, in an httpOnly,
        SameSite=Lax cookie. Need help? Read the{" "}
        <Link href="/policies" className="underline underline-offset-2 hover:text-burgundy">
          policies
        </Link>
        .
      </p>
    </div>
  );
}
