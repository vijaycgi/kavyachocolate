import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/admin/auth-actions";
import { getAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

type Search = { error?: string; next?: string; reason?: string; loggedout?: string };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const admin = await getAdmin();
  if (admin) redirect("/admin");

  const message =
    params.error === "invalid"
      ? "That email and password do not match an admin account."
      : params.error === "missing"
        ? "Enter both your email and password."
        : params.reason === "session"
          ? "Your session expired. Sign in again to continue."
          : params.loggedout
            ? "You have been signed out."
            : "";

  const next = params.next ?? "/admin";

  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <div className="on-dark relative hidden flex-col justify-between bg-burgundy p-10 text-paper lg:flex">
        <Link href="/" aria-label="Kavya Chocolat — home">
          <Image
            src="/images/kavya-chocolat-logo.svg"
            alt="Kavya Chocolat"
            width={84}
            height={49}
            className="h-12 w-auto brightness-0 invert"
          />
        </Link>
        <div className="max-w-[24rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/75">
            Store operations
          </p>
          <p className="mt-5 text-balance font-display text-4xl leading-[1.06]">
            The counter opens from here.
          </p>
          <p className="mt-5 text-[13px] leading-relaxed text-paper/80">
            Orders, stock, fulfilment and the storefront settings — in one place. Every action is
            verified on the server.
          </p>
        </div>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-paper/75">
          <span>Kavya Chocolat</span>
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-paper">
            <ArrowLeft size={12} aria-hidden /> Storefront
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-[26rem]">
          <div className="lg:hidden">
            <Link href="/" aria-label="Kavya Chocolat — home">
              <Image
                src="/images/kavya-chocolat-logo.svg"
                alt="Kavya Chocolat"
                width={84}
                height={49}
                className="h-11 w-auto"
              />
            </Link>
          </div>

          <div className="mt-10 lg:mt-0">
            <p className="eyebrow">Authorised staff</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05]">
              Admin sign in.
            </h1>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
              Use the admin account created during setup. Customers do not need an account to
              order.
            </p>
          </div>

          {message ? (
            <p
              role="alert"
              className="mt-6 border border-burgundy/30 bg-burgundy/5 px-3 py-2.5 text-[12.5px] leading-relaxed text-burgundy"
            >
              {message}
            </p>
          ) : null}

          <form action={loginAction} className="mt-7 space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="field"
                placeholder="admin@kavya.local"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              <LockKeyhole size={14} aria-hidden /> Sign in
            </button>
          </form>

          <p className="mt-6 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-2">
            Sessions are stored as hashed tokens in an httpOnly cookie and expire after seven
            days. Change the seeded password before deploying.
          </p>

          <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-2 hover:text-burgundy lg:hidden">
            <ArrowLeft size={12} aria-hidden /> Back to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
