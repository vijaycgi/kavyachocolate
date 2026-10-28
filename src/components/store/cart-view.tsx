"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/money";

export function CartView({ email }: { email: string }) {
  const { lines, hydrated, subtotalMinor, setQuantity, removeLine, count } = useCart();

  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="h-40 animate-pulse border border-line bg-cream" />
        <div className="h-40 animate-pulse border border-line bg-cream" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 border border-line bg-cream px-6 py-16 text-center sm:py-20">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-line bg-paper">
          <ShoppingBag size={24} strokeWidth={1.4} aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-2xl">Your bag is empty.</h2>
        <p className="mx-auto mt-3 max-w-[38ch] text-sm leading-relaxed text-ink-2">
          Start with the classic 70%, or take all four bars home. No payment is collected
          online — we confirm the order first.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            Shop the collection
          </Link>
          <Link href="/products/classic-70-dark-chocolate" className="btn btn-outline">
            The classic
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1.45fr_0.65fr] lg:gap-14">
      <div>
        <div className="flex items-center justify-between border-b border-line pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">
            {count} {count === 1 ? "bar" : "bars"}
          </p>
          <Link href="/shop" className="text-[10px] uppercase tracking-[0.14em] text-burgundy underline-offset-4 hover:underline">
            Keep shopping
          </Link>
        </div>

        <ul className="divide-y divide-line">
          {lines.map((line) => (
            <li key={line.variantId} className="grid grid-cols-[5.5rem_1fr] gap-4 py-5 sm:grid-cols-[7rem_1fr_auto] sm:gap-6">
              <Link
                href={`/products/${line.slug}`}
                className="relative aspect-[4/5] overflow-hidden border border-line bg-paper-2"
              >
                <Image src={line.imageUrl} alt="" fill sizes="112px" className="object-cover" />
              </Link>

              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/products/${line.slug}`}
                      className="text-base font-medium leading-snug transition-colors hover:text-burgundy"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs text-ink-2">
                      {line.variantName} · {line.sku}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(line.variantId)}
                    aria-label={`Remove ${line.name}`}
                    className="p-1 text-ink-2 transition-colors hover:text-burgundy sm:hidden"
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center border border-line bg-cream">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      aria-label={`Decrease quantity of ${line.name}`}
                      className="flex size-10 items-center justify-center text-ink-2 disabled:opacity-40"
                    >
                      <Minus size={14} aria-hidden />
                    </button>
                    <span className="num w-9 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      disabled={line.quantity >= line.stock || line.quantity >= 20}
                      aria-label={`Increase quantity of ${line.name}`}
                      className="flex size-10 items-center justify-center text-ink-2 disabled:opacity-40"
                    >
                      <Plus size={14} aria-hidden />
                    </button>
                  </div>
                  <span className="num text-sm text-ink-2">
                    {formatMoney(line.priceMinor)} each
                  </span>
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-between border-t border-line/60 pt-3 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
                <p className="num text-base">{formatMoney(line.priceMinor * line.quantity)}</p>
                <button
                  type="button"
                  onClick={() => removeLine(line.variantId)}
                  className="mt-2 hidden text-[10px] uppercase tracking-[0.14em] text-ink-2 underline-offset-4 hover:text-burgundy hover:underline sm:inline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-xs leading-relaxed text-ink-2">
          Stock is checked again on the server when you place the order. If a bar sells out in
          the meantime, we will ask you to adjust the bag — no payment has been taken.
        </p>
      </div>

      <aside className="h-fit border border-line bg-cream p-5 sm:p-6 lg:sticky lg:top-28">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-2">
          Order summary
        </p>
        <dl className="mt-5 space-y-3 border-b border-line pb-5 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-2">Subtotal</dt>
            <dd className="num">{formatMoney(subtotalMinor)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-2">Shipping</dt>
            <dd className="text-[11px] uppercase tracking-[0.1em] text-ink-2">
              Calculated next
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex items-baseline justify-between gap-4">
          <span className="font-display text-2xl">Total so far</span>
          <span className="num text-lg">{formatMoney(subtotalMinor)}</span>
        </div>

        <Link href="/checkout" className="btn btn-primary mt-6 w-full">
          Continue to checkout <ArrowRight size={15} aria-hidden />
        </Link>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-2">
          No card details. No online payment. We confirm every order by email or phone.
        </p>

        <div className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-2">
          <p className="font-semibold uppercase tracking-[0.12em] text-ink">Need help?</p>
          <p className="mt-1.5">
            Write to{" "}
            <a className="underline underline-offset-2" href={`mailto:${email}`}>
              {email}
            </a>{" "}
            with your order number.
          </p>
        </div>
      </aside>
    </div>
  );
}
