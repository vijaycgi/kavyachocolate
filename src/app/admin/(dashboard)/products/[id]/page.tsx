import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { deleteProductAction, setProductPublishedAction } from "@/app/admin/(dashboard)/actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ProductForm } from "@/components/admin/product-form";
import { Flash } from "@/components/admin/ui";
import { VariantForm } from "@/components/admin/variant-form";
import { prisma } from "@/lib/db";

export const metadata = { title: "Edit product" };

type Search = { saved?: string; error?: string };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ active: "desc" }, { weightGrams: "asc" }] },
      _count: { select: { orderItems: true } },
    },
  });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-2 hover:text-burgundy">
          <ArrowLeft size={13} aria-hidden /> Products
        </Link>
        <Link href={`/products/${product.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-2 hover:text-burgundy">
          View on storefront <ExternalLink size={12} aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">Product</p>
          <h1 className="mt-2 font-display text-3xl leading-[1.06] sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-[11px] text-ink-2">
            /products/{product.slug} · updated {product.updatedAt.toLocaleDateString("en-IN")}
          </p>
        </div>
        <form action={setProductPublishedAction}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="published" value={product.published ? "false" : "true"} />
          <button type="submit" className="btn btn-outline btn-sm">
            {product.published ? "Unpublish product" : "Publish product"}
          </button>
        </form>
      </div>

      <Flash saved={query.saved} error={query.error} />

      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          collection: product.collection,
          tagline: product.tagline,
          description: product.description,
          story: product.story,
          ingredients: product.ingredients,
          allergens: product.allergens,
          cocoaPercent: product.cocoaPercent,
          imageUrl: product.imageUrl,
          hoverImageUrl: product.hoverImageUrl,
          featured: product.featured,
          published: product.published,
          position: product.position,
        }}
      />

      <section className="space-y-4 border-t border-line pt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Variants &amp; prices</h2>
            <p className="mt-1 text-[12px] text-ink-2">
              Every variant is an orderable size. Prices are inclusive of tax as configured.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-ink-2">
            {product.variants.filter((variant) => variant.active).length} active ·{" "}
            {product.variants.length} total
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {product.variants.map((variant) => (
            <VariantForm
              key={variant.id}
              productId={product.id}
              variant={{
                id: variant.id,
                name: variant.name,
                sku: variant.sku,
                weightGrams: variant.weightGrams,
                priceMinor: variant.priceMinor,
                compareAtMinor: variant.compareAtMinor,
                stock: variant.stock,
                lowStockThreshold: variant.lowStockThreshold,
                active: variant.active,
                shippingEligible: variant.shippingEligible,
                internationalEligible: variant.internationalEligible,
              }}
            />
          ))}
          <VariantForm productId={product.id} />
        </div>
      </section>

      <section className="border-t border-line pt-7">
        <h2 className="font-display text-xl">Remove this product</h2>
        <div className="mt-3 flex flex-col justify-between gap-3 border border-burgundy/25 bg-burgundy/5 p-4 sm:flex-row sm:items-center">
          <p className="max-w-[62ch] text-[11.5px] leading-relaxed text-ink-2">
            {product._count.orderItems > 0
              ? `This product appears on ${product._count.orderItems} past order line${product._count.orderItems === 1 ? "" : "s"}. Permanently deleting it would break the order snapshot. Unpublish it instead.`
              : "This product has no order history. Deleting it is permanent and also removes its inventory movements."}
          </p>
          {product._count.orderItems > 0 ? (
            <Link href="/admin/products" className="btn btn-outline btn-sm shrink-0">Keep and unpublish</Link>
          ) : (
            <form action={deleteProductAction} className="shrink-0">
              <input type="hidden" name="id" value={product.id} />
              <ConfirmSubmit
                className="btn btn-sm border-burgundy bg-burgundy text-paper hover:bg-burgundy-deep"
                message={`Permanently delete ${product.name}? This cannot be undone.`}
              >
                Delete permanently
              </ConfirmSubmit>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
