import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { collectionLabel, getStoreProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop all bars",
  description:
    "Four bean-to-bar dark chocolate bars: classic 70%, 70% with cashews and pistachios, jaggery-sweetened, and jaggery with dry fruits.",
  alternates: { canonical: "/shop" },
};

const collections = [
  { value: "", label: "All bars" },
  { value: "CLASSIC", label: "Classic" },
  { value: "DRY_FRUIT", label: "With dry fruits" },
  { value: "JAGGERY", label: "Jaggery-sweetened" },
  { value: "JAGGERY_DRY_FRUIT", label: "Jaggery + dry fruits" },
];

type ShopParams = {
  collection?: string;
  sort?: string;
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopParams>;
}) {
  const params = await searchParams;
  const all = await getStoreProducts();

  const collection = params.collection ?? "";
  const sort = params.sort ?? "featured";
  const validCollection = collections.some((entry) => entry.value === collection)
    ? collection
    : "";

  const products = all
    .filter((product) => !validCollection || product.collection === validCollection)
    .sort((a, b) => {
      if (sort === "price-low" || sort === "price-high") {
        const priceA = Math.min(...a.variants.map((variant) => variant.priceMinor));
        const priceB = Math.min(...b.variants.map((variant) => variant.priceMinor));
        return sort === "price-low" ? priceA - priceB : priceB - priceA;
      }
      if (sort === "name") return a.name.localeCompare(b.name);
      return a.position - b.position;
    });

  const query = (next: Partial<ShopParams>) => {
    const search = new URLSearchParams();
    const merged = { collection: validCollection, sort, ...next };
    if (merged.collection) search.set("collection", merged.collection);
    if (merged.sort && merged.sort !== "featured") search.set("sort", merged.sort);
    const string = search.toString();
    return string ? `/shop?${string}` : "/shop";
  };

  return (
    <div className="page pb-20 pt-12 sm:pt-16">
      <div className="border-b border-line pb-8">
        <p className="eyebrow">The collection</p>
        <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h1 className="font-display text-[clamp(2.6rem,5vw,4.4rem)] leading-[1.05]">
            Four bars.
            <br />
            <span className="text-burgundy">Nothing to hide.</span>
          </h1>
          <p className="max-w-[40ch] text-[15px] leading-relaxed text-ink-2 md:pb-1">
            Every bar starts with cocoa beans and ends with a short ingredient list. Choose by
            sweetness, nuts, or the plain classic.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-5 border-b border-line pb-5 lg:flex-row lg:items-center">
        <nav aria-label="Filter by collection" className="flex flex-wrap gap-x-5 gap-y-2">
          {collections.map((entry) => {
            const active = validCollection === entry.value;
            return (
              <Link
                key={entry.value || "all"}
                href={query({ collection: entry.value })}
                aria-current={active ? "page" : undefined}
                className={`border-b pb-1 text-[10.5px] font-semibold uppercase tracking-[0.15em] transition-colors ${
                  active
                    ? "border-burgundy text-burgundy"
                    : "border-transparent text-ink-2 hover:border-brass hover:text-ink"
                }`}
              >
                {entry.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] uppercase tracking-[0.15em] text-ink-2">Sort</span>
          {[
            ["featured", "Featured"],
            ["price-low", "Price ↑"],
            ["price-high", "Price ↓"],
            ["name", "A–Z"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={query({ sort: value })}
              aria-current={sort === value ? "true" : undefined}
              className={`border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                sort === value
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-2 hover:border-ink hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-baseline justify-between">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink-2">
          {products.length} {products.length === 1 ? "bar" : "bars"}
          {validCollection ? ` · ${collectionLabel(validCollection)}` : ""}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="mt-14 border border-line bg-cream px-6 py-16 text-center">
          <p className="font-display text-2xl">Nothing in this filter yet.</p>
          <p className="mx-auto mt-3 max-w-[40ch] text-sm text-ink-2">
            The collection changes with the season. View every bar or clear the filter.
          </p>
          <Link href="/shop" className="btn btn-primary mt-6">
            View all bars
          </Link>
        </div>
      ) : (
        <div className="mt-7 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} eager={index === 0} />
          ))}
        </div>
      )}

      <div className="mt-12 grid gap-5 border-t border-line pt-5 text-[11px] leading-relaxed text-ink-2 md:grid-cols-2">
        <p>
          Photography is placeholder stock until the owner supplies final bar images. Prices and
          weights are introductory and editable in the admin.
        </p>
        <p>
          Jaggery-sweetened bars contain unrefined cane sugar and are not sugar-free. Allergen
          information is shown on each product page and is pending final verification.
        </p>
      </div>
    </div>
  );
}
