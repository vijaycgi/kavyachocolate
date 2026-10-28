import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchase } from "@/components/store/product-purchase";
import { collectionLabel, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Bar not found" };

  return {
    title: product.name,
    description: `${product.tagline} ${product.description}`.slice(0, 158),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} · Kavya Chocolat`,
      description: product.tagline,
      images: [{ url: product.imageUrl, width: 1200, height: 1500, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const related = await getRelatedProducts(product.slug);
  const images =
    product.images.length > 0
      ? product.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt }))
      : [{ id: product.id, url: product.imageUrl, alt: `${product.name} — placeholder photograph` }];

  const inStock = product.variants.some((variant) => variant.stock > 0);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [`${siteUrl}${product.imageUrl}`],
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "Kavya Chocolat" },
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      name: variant.name,
      sku: variant.sku,
      price: (variant.priceMinor / 100).toFixed(2),
      priceCurrency: "INR",
      availability:
        variant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl}/products/${product.slug}`,
    })),
  };

  return (
    <div className="page pb-20 pt-6 sm:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-2">
        <Link href="/shop" className="hover:text-burgundy">
          Shop
        </Link>
        <ChevronRight size={12} aria-hidden />
        <span className="text-ink">{collectionLabel(product.collection)}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
        <ProductGallery images={images} name={product.name} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-burgundy">
            {collectionLabel(product.collection)}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,3.6vw,3.25rem)] leading-[1.06]">
            {product.name}
          </h1>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">
            {product.tagline}
          </p>

          <div className="mt-6 border-t border-line pt-6">
            <ProductPurchase
              productId={product.id}
              slug={product.slug}
              name={product.name}
              imageUrl={product.imageUrl}
              collection={product.collection}
              variants={product.variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                sku: variant.sku,
                weightGrams: variant.weightGrams,
                priceMinor: variant.priceMinor,
                compareAtMinor: variant.compareAtMinor,
                stock: variant.stock,
                lowStockThreshold: variant.lowStockThreshold,
              }))}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 border-y border-line py-4">
            {[
              { icon: PackageCheck, label: "Small batch", detail: "Made to order" },
              { icon: Truck, label: "Ships in 2–3 days", detail: "India & select countries" },
              { icon: ShieldCheck, label: "No payment online", detail: "Confirmed by email" },
            ].map((item) => (
              <div key={item.label} className="px-2 first:pl-0 last:pr-0">
                <item.icon size={17} strokeWidth={1.5} className="text-burgundy" aria-hidden />
                <p className="mt-2 text-[9.5px] font-semibold uppercase leading-tight tracking-[0.1em] text-ink">
                  {item.label}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-ink-2">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 divide-y divide-line border-y border-line">
            <details className="group" open>
              <summary className="flex items-center justify-between py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                The bar
                <span className="text-ink-2 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="pb-5 text-[13.5px] leading-relaxed text-ink-2">
                <p>{product.description}</p>
                {product.story ? <p className="mt-3">{product.story}</p> : null}
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Ingredients &amp; allergens
                <span className="text-ink-2 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-4 pb-5 text-[13.5px] leading-relaxed text-ink-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
                    Ingredients
                  </p>
                  <p className="mt-1.5">{product.ingredients}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
                    Allergens
                  </p>
                  <p className="mt-1.5">{product.allergens}</p>
                </div>
                {product.cocoaPercent ? (
                  <p className="border-t border-line pt-3 text-[11px]">
                    Cocoa solids: {product.cocoaPercent}% as stated for this bar.
                  </p>
                ) : (
                  <p className="border-t border-line pt-3 text-[11px]">
                    A cocoa percentage is not stated for this bar because it has not been
                    verified. We do not invent one.
                  </p>
                )}
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between py-4 text-[11px] font-semibold uppercase tracking-[0.16em]">
                Shipping &amp; pickup
                <span className="text-ink-2 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="space-y-3 pb-5 text-[13.5px] leading-relaxed text-ink-2">
                <p>{settings["policy.shipping"]}</p>
                <p>
                  Local delivery and studio pickup are offered where configured. The exact fee
                  and available areas are shown at checkout after you enter a postal code.
                </p>
              </div>
            </details>
          </div>

          {!inStock ? (
            <p className="mt-4 border border-burgundy/30 bg-burgundy/5 px-4 py-3 text-xs text-burgundy">
              This batch is sold out. The next batch is being tempered — check back soon.
            </p>
          ) : null}
        </div>
      </div>

      <section className="mt-20 border-t border-line pt-10" aria-labelledby="related-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Also in the collection</p>
            <h2 id="related-heading" className="section-title mt-3">
              Try another bar.
            </h2>
          </div>
          <Link href="/shop" className="link-underline hidden sm:inline-flex">
            All bars
          </Link>
        </div>
        <div className="mt-7 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item, index) => (
            <ProductCard key={item.id} product={item} index={index} />
          ))}
        </div>
      </section>

      <p className="mt-14 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-2">
        Prices, weights and photography are placeholders. The product name and ingredient list
        are supplied by the maker; allergen declarations are pending final verification. Jaggery
        is unrefined cane sugar, not a sugar-free ingredient.
      </p>
    </div>
  );
}
