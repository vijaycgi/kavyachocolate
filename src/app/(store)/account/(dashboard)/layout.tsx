import type { ReactNode } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { customerLogoutAction } from "@/app/(store)/account/actions";
import { AccountNav } from "@/components/account/account-nav";
import { requireCustomer } from "@/lib/customer-auth";

export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const customer = await requireCustomer();

  return (
    <div className="page pb-20 pt-8 sm:pt-12">
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4vw,3.1rem)] leading-[1.06]">
            {customer.name.split(" ")[0]}’s account.
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-2">
            <span>{customer.email}</span>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em]">
              {customer.emailVerifiedAt ? (
                <>
                  <ShieldCheck size={12} className="text-[#4f6144]" aria-hidden />
                  <span className="text-[#3c4b33]">Email verified</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={12} className="text-brass-ink" aria-hidden />
                  <span className="text-brass-ink">Email not verified</span>
                </>
              )}
            </span>
          </p>
        </div>
        <form action={customerLogoutAction}>
          <button type="submit" className="btn btn-outline btn-sm">
            <LogOut size={13} aria-hidden /> Sign out
          </button>
        </form>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <AccountNav />
          <div className="mt-6 hidden border-t border-line pt-4 lg:block">
            <Link
              href="/shop"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-2 hover:text-burgundy"
            >
              Continue shopping →
            </Link>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
