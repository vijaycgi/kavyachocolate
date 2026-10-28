"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/money";

export function CartDrawer() {
  const { lines, open, closeCart, setQuantity, removeLine, subtotalMinor, count } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      const timer = window.setTimeout(() => closeRef.current?.focus(), 30);
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") closeCart();
      };
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(timer);
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = "";
        previousFocus.current?.focus?.();
      };
    }
    return undefined;
  }, [open, closeCart]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close bag"
        onClick={closeCart}
        className={`absolute inset-0 bg-ink/45 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[27rem] flex-col border-l border-line bg-paper shadow-plate transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-2">
              Your bag
            </p>
            <p className="mt-0.5 font-display text-2xl">
              {count === 0 ? "Nothing yet" : `${count} ${count === 1 ? "bar" : "bars"}`}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            tabIndex={open ? 0 : -1}
            className="flex size-11 items-center justify-center border border-line text-ink transition-colors hover:border-ink"
            aria-label="Close bag"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <span className="flex size-16 items-center justify-center rounded-full border border-line bg-cream">
                <ShoppingBag size={24} strokeWidth={1.4} aria-hidden />
              </span>
              <p className="mt-5 font-display text-2xl">Your bag is empty.</p>
              <p className="mt-2 max-w-[30ch] text-sm text-ink-2">
                Four bars, one honest ingredient list. Start with the classic.
              </p>
              <Link href="/shop" onClick={closeCart} className="btn btn-primary mt-6">
                Shop the collection
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line/70">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 px-5 py-5">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeCart}
                    className="relative block h-[5.5rem] w-[4.4rem] shrink-0 overflow-hidden border border-line bg-cream"
                  >
                    <Image
                      src={line.imageUrl}
                      alt=""
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/products/${line.slug}`}
                          onClick={closeCart}
                          className="text-[15px] font-medium leading-snug hover:text-burgundy"
                        >
                          {line.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-2">
                          {line.variantName} · {line.sku}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.variantId)}
                        tabIndex={open ? 0 : -1}
                        className="p-1 text-ink-2 transition-colors hover:text-burgundy"
                        aria-label={`Remove ${line.name} from bag`}
                      >
                        <X size={15} aria-hidden />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center border border-line bg-cream">
                        <button
                          type="button"
                          tabIndex={open ? 0 : -1}
                          onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                          className="flex size-8 items-center justify-center text-ink-2 disabled:opacity-40"
                          aria-label={`Decrease quantity of ${line.name}`}
                        >
                          <Minus size={13} aria-hidden />
                        </button>
                        <span className="num w-8 text-center text-xs">{line.quantity}</span>
                        <button
                          type="button"
                          tabIndex={open ? 0 : -1}
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                          disabled={line.quantity >= line.stock}
                          className="flex size-8 items-center justify-center text-ink-2 disabled:opacity-40"
                          aria-label={`Increase quantity of ${line.name}`}
                        >
                          <Plus size={13} aria-hidden />
                        </button>
                      </div>
                      <p className="num text-sm">{formatMoney(line.priceMinor * line.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <div className="border-t border-line bg-cream px-5 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-2">
                Subtotal
              </span>
              <span className="num text-xl font-semibold tracking-tight">{formatMoney(subtotalMinor)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-2">
              Shipping is calculated at checkout. No payment is collected online.
            </p>
            <div className="mt-4 grid gap-2.5">
              <Link href="/checkout" onClick={closeCart} className="btn btn-primary w-full">
                Continue to checkout
              </Link>
              <Link href="/cart" onClick={closeCart} className="btn btn-outline w-full">
                View full bag
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
