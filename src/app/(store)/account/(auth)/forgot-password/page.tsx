import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/account/auth-shell";
import { ForgotPasswordForm } from "@/components/account/forgot-password-form";
import { emailDeliveryConfigured } from "@/lib/email";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a secure password reset link for your Kavya Chocolat account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  const configured = emailDeliveryConfigured();

  return (
    <AuthShell
      eyebrow="Password help"
      title="Reset your password."
      description="Enter the email on your account. If it matches, we will send a single-use link that expires in one hour."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/account/login" className="font-medium text-burgundy underline underline-offset-2">
            Back to sign in
          </Link>
        </p>
      }
    >
      {params.sent ? (
        <div role="status" className="border border-[#4f6144]/35 bg-[#4f6144]/10 px-4 py-3.5 text-[12.5px] leading-relaxed text-[#3c4b33]">
          If an account exists for that email, a reset link has been requested. The response is the
          same whether or not an account exists.
        </div>
      ) : (
        <ForgotPasswordForm />
      )}

      {!configured ? (
        <p className="mt-5 border border-brass/40 bg-brass/10 px-3.5 py-3 text-[11.5px] leading-relaxed text-[#6d512c]">
          Email delivery is not configured on this deployment. In development the reset link is
          written to the server console; in production it cannot reach an inbox until
          <code className="mx-1 rounded bg-paper-2 px-1 py-0.5 text-[11px]">RESEND_API_KEY</code>
          and
          <code className="mx-1 rounded bg-paper-2 px-1 py-0.5 text-[11px]">EMAIL_FROM</code>
          are set.
        </p>
      ) : null}
    </AuthShell>
  );
}
