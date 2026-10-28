import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { EmptyState, Flash, PageHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { collectionLabel } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { setProductPublishedAction } from "@/app/admin/(dashboard)/actions";

export const metadata = { title: "Products" };

type Search = { saved?: string; error?: string };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const products = await prisma.product.findMany({
    include: {
      variants: { orderBy: { weightGrams: "asc" } },
      _count: { select: { orderItems: true } },
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="The bars."
        description="Edit copy, ingredients, pricing, variants and visibility. Stock is adjusted in Inventory so every change leaves a movement record."
        actions={
          <>
            <Link href="/shop" target="_blank" className="btn btn-outline btn-sm">View shop</Link>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm">
              <Plus size={13} aria-hidden /> New product
            </Link>
          </>
        }
      />

      <Flash saved={params.saved} error={params.error} />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet."
          copy="Create the first bar, then add a variant with a price and opening stock."
          action={<Link href="/admin/products/new" className="btn btn-primary btn-sm">Create a product</Link>}
        />
      ) : (
        <div className="overflow-x-auto border border-line bg-cream">
          <table className="data-table min-w-[54rem]">
            <thead>
              <tr>
                <th>Bar</th>
                <th>Collection</th>
                <th>Variants</th>
                <th>Stock</th>
                <th>Price from</th>
                <th>Storefront</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const activeVariants = product.variants.filter((variant) => variant.active);
                const stock = activeVariants.reduce((sum, variant) => sum + variant.stock, 0);
                const low = activeVariants.some((variant) => variant.stock <= variant.lowStockThreshold);
                const prices = activeVariants.map((variant) => variant.priceMinor);
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-9 shrink-0 overflow-hidden border border-line bg-paper-2">
                          <Image src={product.imageUrl} alt="" fill sizes="36px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product.id}`} className="block font-medium hover:text-burgundy">
                            {product.name}
                          </Link>
                          <p className="truncate text-[10.5px] text-ink-2">/products/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-[11.5px] text-ink-2">{collectionLabel(product.collection)}</td>
                    <td className="num text-[12px]">{activeVariants.length}</td>
                    <td>
                      <span className={`num text-[12px] ${low ? "font-semibold text-burgundy" : ""}`}>{stock}</span>
                      {low ? <span className="ml-1 text-[9px] uppercase tracking-[0.1em] text-burgundy">low</span> : null}
                    </td>
                    <td className="num text-[12px]">{prices.length ? formatMoney(Math.min(...prices)) : "—"}</td>
                    <td>
                      <form action={setProductPublishedAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="published" value={product.published ? "false" : "true"} />
                        <span className={`text-[9px] font-semibold uppercase tracking-[0.1em] ${product.published ? "text-[#3c4b33]" : "text-ink-2"}`}>
                          {product.published ? "Live" : "Hidden"}
                        </span>
                        <button type="submit" className="text-[9px] uppercase tracking-[0.1em] text-ink-2 underline-offset-2 hover:text-burgundy hover:underline">
                          {product.published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/products/${product.id}`} className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-burgundy hover:underline">
                        Edit <ArrowRight size={11} aria-hidden />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10.5px] leading-relaxed text-ink-2">
        Prices are stored in paise. Product photos are image paths under /public; use a landscape
        or portrait crop at least 1200px tall. Placeholder photography must be replaced before
        launch.
      </p>
    </div>
  );
}
