import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Our craft",
  description:
    "How Kavya Chocolat makes bean-to-bar chocolate: selecting cocoa beans, roasting, refining, tempering and moulding in small batches.",
  alternates: { canonical: "/craft" },
};

const steps = [
  {
    number: "01",
    title: "Select",
    copy: "We begin with cocoa beans, not a pre-made chocolate base. The bean decides the bar: its fruit, its bitterness, its finish.",
  },
  {
    number: "02",
    title: "Roast",
    copy: "Small roasts are easier to taste and easier to correct. We roast to develop the cocoa without flattening it.",
  },
  {
    number: "03",
    title: "Refine",
    copy: "The beans are ground slowly. Time, not additives, turns the texture glossy and the flavour round.",
  },
  {
    number: "04",
    title: "Temper",
    copy: "Tempering is the difference between chocolate that snaps and chocolate that smears. We work in small batches and check by hand.",
  },
  {
    number: "05",
    title: "Mould",
    copy: "Poured, set, cut and wrapped in the same kitchen. Every bar is handled more than a factory bar ever would be.",
  },
];

export default function CraftPage() {
  return (
    <div>
      <section className="page grid gap-10 pb-16 pt-10 sm:pt-14 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">Our craft</p>
          <h1 className="hero-title mt-5 max-w-[13ch] text-ink">
            Slow is the <span className="text-burgundy">only shortcut.</span>
          </h1>
          <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-ink-2">
            Bean-to-bar is a commitment to doing the unglamorous parts: sourcing, roasting,
            refining, tempering, cleaning up, and doing it again next week. We make four bars
            because four is what we can make properly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-primary">
              Shop the collection <ArrowRight size={15} aria-hidden />
            </Link>
            <Link href="/policies" className="btn btn-outline">
              Read our policies
            </Link>
          </div>
        </div>

        <div className="relative min-h-[24rem] overflow-hidden border border-line bg-paper-2 lg:min-h-[34rem]">
          <Image
            src="/images/editorial/atelier.jpg"
            alt="Hands working with chocolate in the studio — placeholder photograph"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-4 border border-paper/25" />
          <p className="absolute bottom-6 left-6 max-w-[22ch] font-display text-xl leading-snug text-paper">
            Made in small batches, by hand.
          </p>
        </div>
      </section>

      <section className="on-dark bg-burgundy text-paper">
        <div className="page grid gap-8 py-14 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">The promise</p>
            <h2 className="mt-4 font-display text-3xl leading-[1.08] sm:text-4xl">
              Real cocoa beans. A short list. Nothing invented.
            </h2>
          </div>
          <div className="grid gap-6 text-[14px] leading-relaxed text-paper/80 sm:grid-cols-2">
            <p>
              We do not publish health claims, certifications or cocoa percentages we cannot
              verify. The ingredient list is the claim.
            </p>
            <p>
              Jaggery is unrefined cane sugar. Our jaggery bars are sweetened with it — they are
              not sugar-free, and we will never label them that way.
            </p>
          </div>
        </div>
      </section>

      <section className="page py-16 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">The process</p>
            <h2 className="section-title mt-4 max-w-[12ch]">Five steps, no filler.</h2>
            <p className="mt-5 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-2">
              This is the working process for the collection. Exact roast profiles and batch
              sizes belong to the maker and can change with the bean.
            </p>
            <div className="relative mt-8 aspect-[4/3] overflow-hidden border border-line bg-paper-2">
              <Image
                src="/images/editorial/beans.jpg"
                alt="Cocoa beans — placeholder photograph"
                fill
                sizes="(min-width: 1024px) 34vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <ol className="border-t border-line">
            {steps.map((step) => (
              <li key={step.number} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-line py-7 sm:grid-cols-[4rem_1fr] sm:gap-8">
                <span className="num pt-1 text-[11px] font-semibold tracking-[0.16em] text-brass-ink">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-display text-3xl leading-[1.05]">{step.title}</h3>
                  <p className="mt-3 max-w-[58ch] text-[13.5px] leading-relaxed text-ink-2">
                    {step.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-paper-2">
        <div className="page grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <div className="relative min-h-[22rem] overflow-hidden border border-line">
            <Image
              src="/images/editorial/nuts.jpg"
              alt="Cashews and pistachios — placeholder photograph"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="eyebrow">The ingredients</p>
            <h2 className="mt-4 font-display text-3xl leading-[1.08] sm:text-4xl">
              Cashews and pistachios go in at the end.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[14px] leading-relaxed text-ink-2">
              Toasting the nuts separately keeps them crisp instead of soft. We fold them into
              tempered chocolate by hand, then cut and wrap the same day. This is why the
              dry-fruit bars are made in smaller runs.
            </p>
            <div className="mt-6 border-t border-line pt-5 text-[11px] leading-relaxed text-ink-2">
              <p>
                Allergens: cashews and pistachios are tree nuts and appear in two of the four
                bars. Allergen declarations are pending final verification before launch.
              </p>
            </div>
            <Link href="/shop?collection=DRY_FRUIT" className="link-underline mt-7">
              Shop the dry-fruit bars <ArrowRight size={13} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="page py-16 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-line pt-8 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Taste it</p>
            <h2 className="section-title mt-4 max-w-[16ch]">Four bars are waiting.</h2>
          </div>
          <Link href="/shop" className="btn btn-primary">
            Shop all bars <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
