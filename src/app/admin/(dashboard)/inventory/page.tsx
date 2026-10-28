import Link from "next/link";
import { Boxes, PackageMinus, Plus } from "lucide-react";
import { adjustStockAction } from "@/app/admin/(dashboard)/actions";
import { Flash, PageHeader, StatCard } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/money";

export const metadata = { title: "Inventory" };

type Search = { saved?: string; error?: string; view?: string };

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const showAll = params.view === "all";

  const [variants, movements] = await Promise.all([
    prisma.variant.findMany({
      where: showAll ? {} : { active: true },
      include: { product: { select: { name: true, id: true, slug: true } } },
      orderBy: [{ stock: "asc" }, { sku: "asc" }],
    }),
    prisma.inventoryMovement.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const activeVariants = variants.filter((variant) => variant.active);
  const totalUnits = activeVariants.reduce((sum, variant) => sum + variant.stock, 0);
  const lowCount = activeVariants.filter(
    (variant) => variant.stock > 0 && variant.stock <= variant.lowStockThreshold,
  ).length;
  const outCount = activeVariants.filter((variant) => variant.stock === 0).length;
  const stockValue = activeVariants.reduce(
    (sum, variant) => sum + variant.stock * variant.priceMinor,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Stock, with a paper trail."
        description="Orders decrement stock inside the order transaction. Cancellations restore it. Manual adjustments below are for restocks, corrections, samples and damage."
        actions={
          <Link href={`/admin/inventory${showAll ? "" : "?view=all"}`} className="btn btn-outline btn-sm">
            {showAll ? "Active only" : "Show archived"}
          </Link>
        }
      />

      <Flash saved={params.saved} error={params.error} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Units on hand" value={String(totalUnits)} detail="Across active variants" />
        <StatCard label="Low stock" value={String(lowCount)} detail="At or below threshold" emphasis={lowCount > 0} />
        <StatCard label="Sold out" value={String(outCount)} detail="Active variants with zero stock" />
        <StatCard label="Stock value" value={formatMoney(stockValue)} detail="At current selling prices" />
      </div>

      <section className="border border-line bg-cream">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Plus size={13} className="text-burgundy" aria-hidden />
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
            Adjust stock
          </h2>
        </div>
        <form action={adjustStockAction} className="grid gap-3 p-4 lg:grid-cols-[1.6fr_0.5fr_0.8fr_1fr_auto] lg:items-end">
          <div>
            <label htmlFor="variantId" className="label">Variant</label>
            <select id="variantId" name="variantId" required className="field min-h-10 text-[12px]">
              {activeVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.product.name} · {variant.name} ({variant.sku}) — {variant.stock} in stock
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="delta" className="label">Change</label>
            <input id="delta" name="delta" type="number" required placeholder="+12" className="field min-h-10 text-[12px]" />
            <p className="hint">Negative to remove.</p>
          </div>
          <div>
            <label htmlFor="reason" className="label">Reason</label>
            <select id="reason" name="reason" className="field min-h-10 text-[12px]" defaultValue="RESTOCK">
              <option value="RESTOCK">Restock</option>
              <option value="CORRECTION">Correction</option>
              <option value="RETURN">Return</option>
              <option value="SAMPLE">Sample</option>
              <option value="DAMAGE">Damage</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="note" className="label">Note</label>
            <input id="note" name="note" maxLength={160} className="field min-h-10 text-[12px]" placeholder="Batch 12 restock" />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Apply</button>
        </form>
      </section>

      {variants.length === 0 ? (
        <p className="border border-dashed border-line bg-cream px-5 py-10 text-center text-sm text-ink-2">
          No variants found. Add a product and variant first.
        </p>
      ) : (
        <div className="overflow-x-auto border border-line bg-cream">
          <table className="data-table min-w-[50rem]">
            <thead>
              <tr>
                <th>Variant</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => {
                const low = variant.stock > 0 && variant.stock <= variant.lowStockThreshold;
                const out = variant.stock === 0;
                return (
                  <tr key={variant.id} className={variant.active ? "" : "opacity-55"}>
                    <td>
                      <Link href={`/admin/products/${variant.productId}`} className="font-medium hover:text-burgundy">
                        {variant.product.name}
                      </Link>
                      <p className="text-[10.5px] text-ink-2">{variant.name}</p>
                    </td>
                    <td className="font-mono text-[10.5px] text-ink-2">{variant.sku}</td>
                    <td className={`num font-semibold ${out ? "text-burgundy" : low ? "text-[#6d512c]" : ""}`}>
                      {variant.stock}
                    </td>
                    <td className="num text-[11px] text-ink-2">{variant.lowStockThreshold}</td>
                    <td>
                      {!variant.active ? (
                        <span className="tag">Archived</span>
                      ) : out ? (
                        <span className="tag border-burgundy/30 text-burgundy">Sold out</span>
                      ) : low ? (
                        <span className="tag border-brass/50 text-[#6d512c]">Low</span>
                      ) : (
                        <span className="tag border-[#4f6144]/30 text-[#3c4b33]">Healthy</span>
                      )}
                    </td>
                    <td className="num text-[11.5px]">{formatMoney(variant.stock * variant.priceMinor)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="border border-line bg-cream">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
            <Boxes size={13} aria-hidden /> Recent movements
          </h2>
          <span className="text-[10px] text-ink-2">Last 20</span>
        </div>
        {movements.length === 0 ? (
          <div className="flex items-center gap-3 px-4 py-8 text-[12px] text-ink-2">
            <PackageMinus size={16} aria-hidden />
            No stock movements yet. Orders and manual adjustments will appear here.
          </div>
        ) : (
          <ul className="divide-y divide-line/60">
            {movements.map((movement) => (
              <li key={movement.id} className="grid gap-1 px-4 py-2.5 text-[11.5px] sm:grid-cols-[7rem_1fr_5rem_4rem] sm:items-center sm:gap-3">
                <span className="text-[10px] uppercase tracking-[0.08em] text-ink-2">
                  {formatDateTime(movement.createdAt)}
                </span>
                <div className="min-w-0">
                  <p className="truncate">
                    {movement.product.name}
                    <span className="text-ink-2"> · {movement.reason}</span>
                  </p>
                  {movement.note ? <p className="truncate text-[10px] text-ink-2">{movement.note}</p> : null}
                </div>
                <span className={`num font-semibold ${movement.delta > 0 ? "text-[#3c4b33]" : "text-burgundy"}`}>
                  {movement.delta > 0 ? "+" : ""}{movement.delta}
                </span>
                <span className="num text-[10px] text-ink-2">→ {movement.stockAfter}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
