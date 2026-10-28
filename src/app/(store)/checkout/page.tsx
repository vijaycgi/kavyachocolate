import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getFulfillmentOptions } from "@/lib/fulfillment";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm your delivery details and place a Kavya Chocolat order.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [options, settings] = await Promise.all([getFulfillmentOptions(), getSettings()]);

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
      />
    </div>
  );
}
