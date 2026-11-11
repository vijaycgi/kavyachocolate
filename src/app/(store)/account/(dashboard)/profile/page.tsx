import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProfileForm } from "@/components/account/profile-form";
import { requireCustomer } from "@/lib/customer-auth";
import { formatDate } from "@/lib/money";

export default async function ProfilePage() {
  const customer = await requireCustomer();

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="font-display text-2xl">Profile</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          The name and phone used on future orders. Changes are saved to your customer record and
          persist across sessions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <section className="border border-line bg-cream p-5 sm:p-6">
          <ProfileForm
            name={customer.name}
            phone={customer.phone ?? ""}
            email={customer.email}
          />
        </section>

        <aside className="space-y-4">
          <div className="border border-line p-4 text-[11.5px] leading-relaxed text-ink-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
              Account record
            </p>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em]">Member since</dt>
                <dd className="text-ink">{formatDate(customer.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em]">Email status</dt>
                <dd className="text-ink">
                  {customer.emailVerifiedAt ? "Verified" : "Not verified"}
                </dd>
              </div>
            </dl>
          </div>
          <Link href="/account/addresses" className="block border border-line p-4 text-[11px] font-semibold uppercase tracking-[0.13em] transition-colors hover:border-ink">
            <span className="flex items-center justify-between gap-3">
              Saved addresses <ArrowRight size={13} aria-hidden />
            </span>
          </Link>
          <Link href="/account/security" className="block border border-line p-4 text-[11px] font-semibold uppercase tracking-[0.13em] transition-colors hover:border-ink">
            <span className="flex items-center justify-between gap-3">
              Password &amp; security <ArrowRight size={13} aria-hidden />
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
