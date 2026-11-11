import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { getFulfillmentOptions } from "@/lib/fulfillment";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm your delivery details and place a Kavya Chocolat order.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [options, settings, customer] = await Promise.all([
    getFulfillmentOptions(),
    getSettings(),
    getCustomer(),
  ]);

  const savedAddress = customer
    ? await prisma.address.findFirst({
        where: { customerId: customer.id, orderId: null, isDefault: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return (
    <div className="page pb-20 pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="text-[10px] uppercase tracking-[0.14em] text-ink-2">
        <Link href="/cart" className="hover:text-burgundy">
          Bag
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">Checkout</span>
      </nav>

      <div className="mt-5 flex flex-col justify-between gap-5 border-b border-line pb-7 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">No payment online</p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,5vw,4rem)] leading-[1.06]">
            Checkout.
          </h1>
        </div>
        <p className="max-w-[42ch] text-[13px] leading-relaxed text-ink-2 md:text-right">
          Tell us where the chocolate is going. We will confirm the order and arrange payment
          offline — no card fields, no gateway.
        </p>
      </div>

      {customer ? (
        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border border-line bg-cream px-4 py-3 text-[11.5px] text-ink-2">
          Signed in as <strong className="font-medium text-ink">{customer.email}</strong>. This
          order will appear in your account history.
          <Link href="/account" className="text-burgundy underline underline-offset-2">
            Account
          </Link>
        </p>
      ) : (
        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border border-line bg-cream px-4 py-3 text-[11.5px] text-ink-2">
          Checking out as a guest.
          <Link href="/account/login?next=%2Fcheckout" className="text-burgundy underline underline-offset-2">
            Sign in
          </Link>
          to keep this order in your account.
        </p>
      )}

      <CheckoutForm
        countries={options.countries}
        pickups={options.pickups.map((pickup) => ({
          id: pickup.id,
          name: pickup.name,
          addressLine: pickup.addressLine,
          city: pickup.city,
          postalCode: pickup.postalCode,
          hours: pickup.hours,
          instructions: pickup.instructions,
          phone: pickup.phone,
        }))}
        pickupNote={settings["store.pickupNote"]}
        taxLabel={settings["store.taxLabel"]}
        account={
          customer
            ? { name: customer.name, email: customer.email, phone: customer.phone ?? "" }
            : null
        }
        savedAddress={
          savedAddress
            ? {
                line1: savedAddress.line1,
                line2: savedAddress.line2 ?? "",
                city: savedAddress.city,
                state: savedAddress.state ?? "",
                postalCode: savedAddress.postalCode,
                country: savedAddress.country,
                name: savedAddress.name,
                phone: savedAddress.phone ?? "",
              }
            : null
        }
      />
    </div>
  );
}
