"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney, formatWeight } from "@/lib/money";

export type PurchaseVariant = {
  id: string;
  name: string;
  sku: string;
  weightGrams: number;
  priceMinor: number;
  compareAtMinor: number | null;
  stock: number;
  lowStockThreshold: number;
};

export function ProductPurchase({
  productId,
  slug,
  name,
  imageUrl,
  variants,
  collection,
}: {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  variants: PurchaseVariant[];
  collection: string;
}) {
  const firstAvailable = variants.find((variant) => variant.stock > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const { addLine } = useCart();

  const selected = useMemo(
    () => variants.find((variant) => variant.id === selectedId) ?? variants[0],
    [variants, selectedId],
  );

  const soldOut = !selected || selected.stock === 0;
  const max = selected ? Math.max(1, Math.min(20, selected.stock)) : 1;

  function changeQuantity(next: number) {
    setQuantity(Math.min(max, Math.max(1, next)));
  }

  function handleAdd() {
    if (!selected || soldOut) return;
    addLine(
      {
        variantId: selected.id,
        productId,
        slug,
        name,
        variantName: selected.name,
        sku: selected.sku,
        weightGrams: selected.weightGrams,
        priceMinor: selected.priceMinor,
        imageUrl,
        stock: selected.stock,
      },
      quantity,
    );
    setQuantity(1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="num text-[2.1rem] font-semibold leading-none tracking-tight text-ink" aria-live="polite">
          {selected ? formatMoney(selected.priceMinor) : "Price pending"}
        </p>
        {selected?.compareAtMinor ? (
          <p className="num pb-1 text-sm text-ink-2 line-through">
            {formatMoney(selected.compareAtMinor)}
          </p>
        ) : null}
        <p className="pb-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-2">
          Placeholder price · tax not configured
        </p>
      </div>

      <div className="mt-6">
        <p className="label" id="variant-label">
          Choose a size
        </p>
        <div role="group" aria-labelledby="variant-label" className="grid gap-2 sm:grid-cols-2">
          {variants.map((variant) => {
            const active = variant.id === selected?.id;
            const out = variant.stock === 0;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelectedId(variant.id);
                  setQuantity(1);
                }}
                aria-pressed={active}
                disabled={out}
                className={`flex items-center justify-between gap-3 border px-4 py-3 text-left transition-colors ${
                  active
                    ? "border-burgundy bg-burgundy text-paper"
                    : "border-line bg-cream text-ink hover:border-ink-2"
                } ${out ? "cursor-not-allowed opacity-45" : ""}`}
              >
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
                    {variant.name}
                  </span>
                  <span
                    className={`mt-0.5 block text-[10px] uppercase tracking-[0.1em] ${
                      active ? "text-paper/80" : "text-ink-2"
                    }`}
                  >
                    {out ? "Sold out" : `${variant.stock} in stock`}
                  </span>
                </span>
                <span className="num text-sm">{formatMoney(variant.priceMinor)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex min-h-12 items-center border border-line bg-cream">
          <button
            type="button"
            onClick={() => changeQuantity(quantity - 1)}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex size-11 items-center justify-center text-ink-2 disabled:opacity-40"
          >
            <Minus size={15} aria-hidden />
          </button>
          <span className="num w-9 text-center text-sm" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => changeQuantity(quantity + 1)}
            disabled={quantity >= max}
            aria-label="Increase quantity"
            className="flex size-11 items-center justify-center text-ink-2 disabled:opacity-40"
          >
            <Plus size={15} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="btn btn-primary min-w-[12rem] flex-1"
        >
          {soldOut
            ? "Sold out"
            : `Add to bag — ${formatMoney((selected?.priceMinor ?? 0) * quantity)}`}
        </button>
      </div>

      {selected && selected.stock > 0 && selected.stock <= selected.lowStockThreshold ? (
        <p className="mt-3 text-xs text-burgundy">
          Only {selected.stock} left in this batch.
        </p>
      ) : null}

      <div className="mt-6 space-y-2 border-t border-line pt-4 text-[12px] leading-relaxed text-ink-2">
        <p>
          <strong className="font-medium text-ink">No online payment.</strong> We confirm your
          order by email or phone, then arrange payment and dispatch.
        </p>
        <p>
          Courier, local delivery and studio pickup are available at checkout. Shipping is
          calculated before you place the order.
        </p>
        <p>
          {collection.includes("JAGGERY")
            ? "Jaggery is unrefined cane sugar. This bar is jaggery-sweetened, not sugar-free."
            : `Bar weight: ${variants.map((variant) => formatWeight(variant.weightGrams)).join(" or ")}.`}
        </p>
      </div>
    </div>
  );
}
