import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/account/auth-shell";
import { GoogleButton } from "@/components/account/google-button";
import { LoginForm } from "@/components/account/login-form";
import { getCustomer, safeAccountNext } from "@/lib/customer-auth";
import { googleOAuthConfigured } from "@/lib/oauth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Kavya Chocolat account to view orders and saved addresses.",
  robots: { index: false, follow: false },
};

type Search = {
  next?: string;
  reason?: string;
  loggedout?: string;
  reset?: string;
  oauth?: string;
};

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const customer = await getCustomer();
  if (customer) redirect(safeAccountNext(params.next));

  const notices: string[] = [];
  if (params.reason === "session") notices.push("Your session expired. Sign in again to continue.");
  if (params.loggedout) notices.push("You have been signed out.");
  if (params.reset) notices.push("Your password was reset. Sign in with the new password.");
  if (params.oauth === "link-required") {
    notices.push(
      "An account already uses that email. Sign in with your password once, then link Google from Security.",
    );
  }
  if (params.oauth === "unconfigured") {
    notices.push("Google sign-in is not configured on this deployment.");
  }
  if (params.oauth === "denied") notices.push("Google sign-in was cancelled.");
  if (params.oauth === "unverified") {
    notices.push("Google did not confirm that email address, so we did not link an account.");
  }
  if (params.oauth === "error") {
    notices.push("We could not complete Google sign-in. Try again or use your password.");
  }
  if (params.oauth === "conflict") {
    notices.push("That Google account is linked to a different customer.");
  }

  return (
    <AuthShell
      eyebrow="Your account"
      title="Welcome back."
      description="Sign in to see your orders, receipts and saved addresses. Guest checkout is still available if you would rather not have an account."
      footer={
        <p>
          New to Kavya Chocolat?{" "}
          <Link href="/account/register" className="font-medium text-burgundy underline underline-offset-2">
            Create an account
          </Link>
        </p>
      }
    >
      {notices.length > 0 ? (
        <div className="mb-5 space-y-2">
          {notices.map((notice) => (
            <p
              key={notice}
              role="status"
              className="border border-brass/40 bg-brass/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-[#6d512c]"
            >
              {notice}
            </p>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        <GoogleButton configured={googleOAuthConfigured()} />

        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-ink-2">
          <span className="h-px flex-1 bg-line" />
          or use your email
          <span className="h-px flex-1 bg-line" />
        </div>

        <LoginForm next={safeAccountNext(params.next)} />
      </div>
    </AuthShell>
  );
}
