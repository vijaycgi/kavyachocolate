import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/account/auth-shell";
import { ResetPasswordForm } from "@/components/account/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Kavya Chocolat account.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <AuthShell
      eyebrow="Password reset"
      title={token ? "Choose a new password." : "That link is incomplete."}
      description={
        token
          ? "Use at least ten characters with a letter and a number. Signing in elsewhere will be invalidated when you save."
          : "Open the full link from your reset email, or request a new one."
      }
      footer={
        <p>
          Need a fresh link?{" "}
          <Link href="/account/forgot-password" className="font-medium text-burgundy underline underline-offset-2">
            Request another
          </Link>
        </p>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Link href="/account/forgot-password" className="btn btn-primary w-full">
          Request a reset link
        </Link>
      )}
    </AuthShell>
  );
}
