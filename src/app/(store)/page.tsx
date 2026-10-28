import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { getFeaturedProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: { absolute: "Kavya Chocolat — Four bars. Nothing to hide." },
  description:
    "Bean-to-bar chocolate made in small batches from real cocoa beans. Classic 70%, cashew and pistachio, and jaggery-sweetened bars. Order online without a payment step.",
  alternates: { canonical: "/" },
};

const proof = [
  ["Real cocoa beans", "No cocoa powder shortcut"],
  ["Minimal ingredients", "Cocoa, sugar or jaggery, nuts"],
  ["Small-batch tempered", "Refined and moulded by hand"],
  ["Ships across India", "Local delivery in Bengaluru"],
];

const steps = [
  ["01", "Select", "We start with cocoa beans, not a pre-made chocolate base."],
  ["02", "Roast", "Small roasts develop the cocoa’s fruit and bitterness."],
  ["03", "Refine", "The beans are ground slowly until the texture turns glossy."],
  ["04", "Temper", "Careful tempering gives the bar its snap and shine."],
  ["05", "Mould", "Poured, set, cut and wrapped in the same kitchen."],
];

export default async function HomePage() {
  const [products, settings] = await Promise.all([getFeaturedProducts(), getSettings()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kavya Chocolat",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    logo: "/images/kavya-chocolat-logo.svg",
    email: settings["store.email"],
    description:
      "Small-batch bean-to-bar chocolate made in India with real cocoa beans.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="border-b border-line">
        <div className="page grid items-stretch gap-0 lg:grid-cols-[1.02fr_1fr]">
          <div className="flex flex-col justify-center py-12 pr-0 sm:py-16 lg:py-20 lg:pr-14 xl:pr-20">
            <h1 className="hero-title animate-rise text-ink">
              Four bars.
              <br />
              <span className="text-burgundy">Nothing to hide.</span>
            </h1>
            <p className="mt-7 max-w-[47ch] animate-rise delay-1 text-[1.02rem] leading-relaxed text-ink-2">
              Cocoa beans, sugar or jaggery, and sometimes cashews and pistachios. That is the
              whole recipe — roasted, refined and tempered slowly in our own kitchen.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 animate-rise delay-2">
              <Link href="/shop" className="btn btn-primary">
                Shop the collection <ArrowRight size={15} aria-hidden />
              </Link>
              <Link href="/craft" className="btn btn-outline">
                How we make it
              </Link>
            </div>

            <p className="mt-7 flex max-w-[42ch] items-start gap-3 text-[15px] leading-relaxed text-burgundy">
              <span aria-hidden className="mt-[0.62rem] h-px w-5 shrink-0 bg-brass" />
              <span>The whole recipe fits on the wrapper.</span>
            </p>

            <dl className="mt-10 grid grid-cols-3 border-t border-line pt-5">
              {[
                ["04", "bars in the collection"],
                ["70%", "cocoa in the classic"],
                ["₹0", "collected online"],
              ].map(([value, label], index) => (
                <div
                  key={label}
                  className={index > 0 ? "border-l border-line pl-4 sm:pl-6" : "pr-4"}
                >
                  <dt className="num text-[1.35rem] font-semibold leading-none tracking-tight text-ink sm:text-[1.5rem]">{value}</dt>
                  <dd className="mt-1 text-[11px] uppercase leading-snug tracking-[0.12em] text-ink-2">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative -mx-5 mb-10 mt-2 sm:-mx-8 sm:mb-12 lg:m-0 lg:mb-10 lg:mt-10">
            <div className="relative h-full min-h-[26rem] overflow-hidden bg-burgundy lg:min-h-[38rem]">
              <Image
                src="/images/editorial/hero.jpg"
                alt="A broken dark chocolate bar with pistachios — placeholder photograph"
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/55 via-transparent to-burgundy/10" />
              <div className="absolute inset-4 border border-paper/20 lg:inset-6" />
              <p className="absolute left-7 top-7 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-paper/85 lg:left-9 lg:top-9">
                Plate N° 01 · The 70%
              </p>
            </div>

            <div className="absolute bottom-5 left-5 right-5 max-w-[17rem] border border-paper/25 bg-paper/95 p-4 shadow-plate backdrop-blur-sm sm:bottom-7 sm:left-7 lg:-bottom-6 lg:left-[-2.5rem] lg:right-auto">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                Tasting note
              </p>
              <p className="mt-2 font-display text-xl leading-tight text-ink">
                Cocoa, toasted nut, a clean snap.
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-2">
                Classic 70% · 70 g
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section aria-label="What we promise" className="border-b border-line bg-cream">
        <div className="page grid grid-cols-2 divide-x divide-line md:grid-cols-4">
          {proof.map(([title, detail], index) => (
            <div key={title} className={`py-5 sm:py-6 ${index > 0 ? "pl-4 sm:pl-6" : "pr-4"}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
                {title}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-ink-2">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Collection */}
      <section className="page py-16 sm:py-20 lg:py-24" aria-labelledby="collection-heading">
        <div className="flex flex-col justify-between gap-6 border-b border-line pb-7 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="collection-heading" className="section-title mt-4 max-w-[19ch]">
              Four ways to eat chocolate properly.
            </h2>
          </div>
          <div className="md:max-w-[34ch] md:pb-1">
            <p className="text-sm leading-relaxed text-ink-2">
              The same slow process, four different bars. Choose the plain classic, add nuts, or
              let jaggery carry the sweetness.
            </p>
            <Link href="/shop" className="link-underline mt-4">
              Shop all bars <ArrowRight size={13} aria-hidden />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <p className="mt-9 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-2">
          Placeholder photography and introductory pricing. Final product images, weights and
          prices are being confirmed and are editable in the admin.
        </p>
      </section>

      {/* Honesty band */}
      <section className="on-dark bg-burgundy text-paper" aria-labelledby="honesty-heading">
        <div className="page grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-24">
          <div className="relative min-h-[22rem] overflow-hidden border border-paper/20 lg:min-h-[34rem]">
            <Image
              src="/images/editorial/beans.jpg"
              alt="Cocoa beans — placeholder photograph"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-burgundy-deep/60 to-transparent" />
            <p className="absolute bottom-5 left-5 max-w-[18ch] font-display text-2xl leading-tight text-paper">
              Start with a bean worth tasting.
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <p className="eyebrow">The ingredient ledger</p>
            <h2 id="honesty-heading" className="section-title mt-4 max-w-[20ch]">
              What’s in the bar is the whole story.
            </h2>
            <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-paper/85">
              We publish the ingredient list, not a marketing version of it. No invented cocoa
              percentages, no health claims, no “sugar-free” shortcuts.
            </p>

            <div className="mt-9 grid gap-8 border-t border-paper/20 pt-7 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/75">
                  In the collection
                </p>
                <ul className="mt-4 space-y-3 text-sm text-paper/85">
                  <li className="border-b border-paper/12 pb-3">Cocoa beans</li>
                  <li className="border-b border-paper/12 pb-3">Sugar, or unrefined jaggery</li>
                  <li className="border-b border-paper/12 pb-3">Cashews and pistachios</li>
                  <li>Nothing you can’t read aloud</li>
                </ul>
              </div>
              <div className="relative border border-paper/20 bg-burgundy-deep/35 p-5">
                <p className="font-display text-lg leading-snug text-brass-light">A note on jaggery</p>
                <p className="mt-4 text-[13px] leading-relaxed text-paper/80">
                  Jaggery is unrefined cane sugar. Our jaggery bars are sweetened with it, not
                  made sugar-free. It brings a warmer, malty sweetness that sits behind the cocoa.
                </p>
              </div>
            </div>

            <Link href="/craft" className="mt-9 inline-flex w-fit items-center gap-2 border-b border-brass pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-paper hover:text-brass-light">
              Read the full process <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Craft */}
      <section className="page grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-24" aria-labelledby="craft-heading">
        <div className="lg:sticky lg:top-28 lg:h-[34rem] lg:self-start">
          <div className="relative min-h-[24rem] overflow-hidden border border-line bg-paper-2 lg:h-full lg:min-h-0">
            <Image
              src="/images/editorial/atelier.jpg"
              alt="Chocolate being made by hand — placeholder photograph"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-paper/95 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">
                The studio · Bengaluru
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="eyebrow">How it’s made</p>
          <h2 id="craft-heading" className="section-title mt-4 max-w-[16ch]">
            Slow is the only shortcut.
          </h2>
          <p className="mt-6 max-w-[56ch] text-[15px] leading-relaxed text-ink-2">
            Bean-to-bar means we begin with cocoa beans, not couverture. Each batch is small
            enough to taste as it moves from roast to mould.
          </p>

          <ol className="mt-9 border-t border-line">
            {steps.map(([number, title, copy]) => (
              <li key={number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-line py-4 sm:grid-cols-[3.5rem_10rem_1fr] sm:gap-5">
                <span className="num text-[11px] font-semibold tracking-[0.16em] text-brass-ink">
                  {number}
                </span>
                <span className="font-display text-xl leading-[1.1] text-ink">{title}</span>
                <span className="col-span-2 text-[13px] leading-relaxed text-ink-2 sm:col-span-1">
                  {copy}
                </span>
              </li>
            ))}
          </ol>

          <Link href="/craft" className="link-underline mt-7">
            See the craft <ArrowRight size={13} aria-hidden />
          </Link>
        </div>
      </section>

      {/* Fulfilment */}
      <section className="border-y border-line bg-paper-2" aria-labelledby="fulfilment-heading">
        <div className="page py-14 sm:py-16">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Getting it to you</p>
              <h2 id="fulfilment-heading" className="mt-4 font-display text-3xl sm:text-4xl">
                Three ways to receive it.
              </h2>
            </div>
            <p className="max-w-[34ch] text-[12px] leading-relaxed text-ink-2">
              Rates and areas shown are introductory placeholders. The owner can change every
              rule in Admin → Shipping.
            </p>
          </div>

          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Courier shipping",
                copy: "Across India and selected countries. Packed with insulation where the weather demands it.",
                detail: "₹80 in India · free over ₹1,500",
              },
              {
                number: "02",
                title: "Local delivery",
                copy: "Hand-delivered in Bengaluru by postal-code area, on scheduled days.",
                detail: "₹60 in 560xxx areas",
              },
              {
                number: "03",
                title: "Studio pickup",
                copy: "Collect from the studio by arrangement. We confirm a window before you travel.",
                detail: "No fee · appointment only",
              },
            ].map((item) => (
              <div key={item.number} className="border-t border-ink/25 pt-5">
                <h3 className="font-display text-2xl">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{item.copy}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="page py-16 sm:py-20 lg:py-24" aria-labelledby="closing-heading">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="eyebrow">Start here</p>
            <h2 id="closing-heading" className="hero-title mt-5 max-w-[14ch] text-ink">
              Begin with the <span className="text-burgundy">classic.</span>
            </h2>
            <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-ink-2">
              Cocoa and sugar, nothing else. If you want to know what our beans taste like, this
              is the bar that answers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products/classic-70-dark-chocolate" className="btn btn-primary">
                Shop the classic <ArrowRight size={15} aria-hidden />
              </Link>
              <Link href="/track-order" className="btn btn-outline">
                Track an order
              </Link>
            </div>
            <p className="mt-5 text-xs text-ink-2">
              No payment is collected online. We confirm by email or phone.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden border border-line bg-paper-2 lg:aspect-[5/4]">
            <Image
              src="/images/editorial/collection.jpg"
              alt="Dark chocolate bars — placeholder photograph"
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
