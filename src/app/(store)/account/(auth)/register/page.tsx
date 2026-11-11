import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/account/auth-shell";
import { GoogleButton } from "@/components/account/google-button";
import { RegisterForm } from "@/components/account/register-form";
import { getCustomer } from "@/lib/customer-auth";
import { googleOAuthConfigured } from "@/lib/oauth";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Kavya Chocolat account to keep your orders and addresses together.",
  robots: { index: false, follow: false },
};

export default async function AccountRegisterPage() {
  const customer = await getCustomer();
  if (customer) redirect("/account");

  return (
    <AuthShell
      eyebrow="Open an account"
      title="A place for your orders."
      description="Create an account with your email. We will send a verification link when email delivery is configured; you can still order while it is pending."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/account/login" className="font-medium text-burgundy underline underline-offset-2">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <GoogleButton configured={googleOAuthConfigured()} label="Sign up with Google" />
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-ink-2">
          <span className="h-px flex-1 bg-line" />
          or use your email
          <span className="h-px flex-1 bg-line" />
        </div>
        <RegisterForm />
      </div>
    </AuthShell>
  );
}
