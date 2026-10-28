import type { Metadata } from "next";
import Link from "next/link";
import { getFulfillmentOptions } from "@/lib/fulfillment";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Policies & shipping",
  description:
    "Kavya Chocolat shipping, local delivery, pickup, returns and privacy information. Placeholder policies pending review before launch.",
  alternates: { canonical: "/policies" },
};

export default async function PoliciesPage() {
  const [settings, options] = await Promise.all([getSettings(), getFulfillmentOptions()]);
  const countryNames = new Map(options.countries.map((country) => [country.code, country.name]));

  return (
    <div className="page pb-20 pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="text-[10px] uppercase tracking-[0.14em] text-ink-2">
        <Link href="/" className="hover:text-burgundy">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">Policies</span>
      </nav>

      <div className="mt-5 border-b border-line pb-8">
        <p className="eyebrow">The fine print</p>
        <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.7rem,5.4vw,4.5rem)] leading-[1.05]">
          Shipping, returns and the rest.
        </h1>
        <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
          These policies are placeholders written for this build. They must be reviewed by the
          owner before launch. Rates and areas below are read live from the store configuration.
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
        <nav aria-label="Policies" className="h-fit border border-line bg-cream p-4 lg:sticky lg:top-28">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">On this page</p>
          <ul className="mt-3 space-y-2.5 text-[12.5px]">
            {[
              ["shipping", "Shipping"],
              ["local", "Local delivery"],
              ["pickup", "Studio pickup"],
              ["returns", "Returns & damage"],
              ["privacy", "Privacy"],
              ["contact", "Contact"],
            ].map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-ink-2 underline-offset-4 hover:text-burgundy hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12">
          <section id="shipping" aria-labelledby="shipping-heading" className="scroll-mt-28">
            <h2 id="shipping-heading" className="font-display text-3xl">Shipping</h2>
            <p className="prose-brand mt-4 max-w-[70ch]">{settings["policy.shipping"]}</p>

            <div className="mt-7 overflow-x-auto border border-line">
              <table className="data-table min-w-[34rem]">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Countries</th>
                    <th>Fee</th>
                    <th>Free over</th>
                    <th>Estimate</th>
                  </tr>
                </thead>
                <tbody>
                  {options.zones.map((zone) => (
                    <tr key={zone.id}>
                      <td className="font-medium">{zone.name}</td>
                      <td className="max-w-[16rem] text-ink-2">
                        {zone.countryList.map((code) => countryNames.get(code) ?? code).join(", ")}
                      </td>
                      <td className="num">{formatMoney(zone.feeMinor)}</td>
                      <td className="num">{zone.freeOverMinor > 0 ? formatMoney(zone.freeOverMinor) : "—"}</td>
                      <td className="text-ink-2">
                        {zone.minDays && zone.maxDays ? `${zone.minDays}–${zone.maxDays} working days` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-ink-2">
              Shipping is calculated again on the server when the order is placed. We do not
              auto-convert prices; all prices are in INR.
            </p>
          </section>

          <section id="local" aria-labelledby="local-heading" className="scroll-mt-28">
            <h2 id="local-heading" className="font-display text-3xl">Local delivery</h2>
            <p className="prose-brand mt-4 max-w-[70ch]">
              Hand-delivered within the configured postal-code areas. Enter your postal code at
              checkout to see whether local delivery applies; if it does not, choose courier
              shipping or studio pickup.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {options.areas.map((area) => (
                <div key={area.id} className="border border-line bg-cream p-4">
                  <p className="font-display text-xl">{area.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-2">
                    Postal codes: {area.postalList.join(", ")}
                  </p>
                  <p className="mt-3 text-[12.5px] text-ink-2">
                    {formatMoney(area.feeMinor)} · minimum order {formatMoney(area.minOrderMinor)}
                  </p>
                  <p className="mt-1 text-[12px] text-ink-2">{area.schedule}</p>
                </div>
              ))}
              {options.areas.length === 0 ? (
                <p className="text-sm text-ink-2">No local delivery areas are configured.</p>
              ) : null}
            </div>
          </section>

          <section id="pickup" aria-labelledby="pickup-heading" className="scroll-mt-28">
            <h2 id="pickup-heading" className="font-display text-3xl">Studio pickup</h2>
            <p className="prose-brand mt-4 max-w-[70ch]">{settings["store.pickupNote"]}</p>
            <div className="mt-6 grid gap-3">
              {options.pickups.map((pickup) => (
                <div key={pickup.id} className="border border-line bg-cream p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display text-xl">{pickup.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-ink-2">{pickup.hours}</p>
                  </div>
                  <p className="mt-2 text-[12.5px] text-ink-2">
                    {pickup.addressLine}, {pickup.city} {pickup.postalCode}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-2">{pickup.instructions}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="returns" aria-labelledby="returns-heading" className="scroll-mt-28">
            <h2 id="returns-heading" className="font-display text-3xl">Returns &amp; damage</h2>
            <p className="prose-brand mt-4 max-w-[70ch]">{settings["policy.returns"]}</p>
          </section>

          <section id="privacy" aria-labelledby="privacy-heading" className="scroll-mt-28">
            <h2 id="privacy-heading" className="font-display text-3xl">Privacy</h2>
            <p className="prose-brand mt-4 max-w-[70ch]">{settings["policy.privacy"]}</p>
            <p className="mt-4 max-w-[70ch] text-[12px] leading-relaxed text-ink-2">
              This site stores a cart in your browser and, for the admin, a secure session cookie.
              It does not collect payment details. No third-party analytics or advertising
              scripts are included in this build.
            </p>
          </section>

          <section id="contact" aria-labelledby="contact-heading" className="scroll-mt-28">
            <h2 id="contact-heading" className="font-display text-3xl">Contact</h2>
            <div className="mt-4 grid gap-3 border border-line bg-cream p-5 text-[13px] sm:grid-cols-2">
              <p>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-2">Email</span>
                <a className="mt-1 block underline underline-offset-2" href={`mailto:${settings["store.email"]}`}>
                  {settings["store.email"]}
                </a>
              </p>
              <p>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-2">Phone</span>
                <a className="mt-1 block underline underline-offset-2" href={`tel:${settings["store.phone"].replace(/\s/g, "")}`}>
                  {settings["store.phone"]}
                </a>
              </p>
              <p className="sm:col-span-2">
                <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-2">Studio</span>
                <span className="mt-1 block text-ink-2">{settings["store.address"]}</span>
              </p>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-ink-2">
              Contact details and policies are placeholders and must be replaced with verified
              business information before launch.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
