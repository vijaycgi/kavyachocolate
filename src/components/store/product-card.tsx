import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collectionLabel, priceRange, type StoreProduct } from "@/lib/catalog";
import { formatMoney, formatWeight } from "@/lib/money";

export function ProductCard({
  product,
  index,
  eager = false,
}: {
  product: StoreProduct;
  index: number;
  /** Set on the first card of a grid that sits above the fold. */
  eager?: boolean;
}) {
  const range = priceRange(product);
  const weights = product.variants.map((variant) => formatWeight(variant.weightGrams));
  const soldOut = product.variants.every((variant) => variant.stock === 0);

  return (
    <article className="group relative h-full">
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/5] overflow-hidden border border-line bg-paper-2">
          <Image
            src={product.imageUrl}
            alt={`${product.name} — placeholder photograph`}
            fill
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span className="num absolute left-3 top-3 flex size-8 items-center justify-center border border-paper/50 bg-paper/90 text-[11px] font-semibold tracking-[0.1em] text-ink">
            {String(index + 1).padStart(2, "0")}
          </span>
          {soldOut ? (
            <span className="absolute bottom-3 left-3 bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-paper">
              Sold out
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4 border-t border-line pt-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-burgundy">
              {collectionLabel(product.collection)}
            </p>
            <h3 className="mt-1.5 font-display text-[1.4rem] leading-[1.16] text-ink transition-colors group-hover:text-burgundy">
              {product.name}
            </h3>
            <p className="mt-1.5 line-clamp-2 min-h-[2.75em] text-[13px] leading-snug text-ink-2">
              {product.tagline}
            </p>
          </div>
          <ArrowUpRight
            size={17}
            strokeWidth={1.4}
            aria-hidden
            className="mt-1 shrink-0 text-ink-2 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-burgundy"
          />
        </div>

        <div className="mt-auto flex items-baseline justify-between gap-3 pt-3">
          <p className="num text-sm text-ink">
            {range ? (
              <>
                {range.min === range.max ? formatMoney(range.min) : `From ${formatMoney(range.min)}`}
              </>
            ) : (
              "Price pending"
            )}
          </p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-2">
            {weights.join(" / ")}
          </p>
        </div>
      </Link>
    </article>
  );
}
