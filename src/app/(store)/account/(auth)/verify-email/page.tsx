import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/account/auth-shell";
import { VerifyEmailForm } from "@/components/account/verify-email-form";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Confirm the email address on your Kavya Chocolat account.",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <AuthShell
      eyebrow="Email verification"
      title={token ? "Confirm this email." : "This link is incomplete."}
      description={
        token
          ? "Verifying proves the address belongs to you and links earlier guest orders placed with it. The token can be used once and expires after 24 hours."
          : "Open the full link from your verification email. If it has expired, sign in and request another from your account."
      }
      footer={
        <p>
          Already verified?{" "}
          <Link href="/account/login" className="font-medium text-burgundy underline underline-offset-2">
            Sign in
          </Link>
        </p>
      }
    >
      {token ? (
        <VerifyEmailForm token={token} />
      ) : (
        <Link href="/account/login" className="btn btn-primary w-full">
          Go to sign in
        </Link>
      )}
    </AuthShell>
  );
}
