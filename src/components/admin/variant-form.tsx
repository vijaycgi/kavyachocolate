import { Archive, Save } from "lucide-react";
import {
  deactivateVariantAction,
  saveVariantAction,
} from "@/app/admin/(dashboard)/actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { minorToRupees } from "@/lib/money";

export type VariantFields = {
  id: string;
  name: string;
  sku: string;
  weightGrams: number;
  priceMinor: number;
  compareAtMinor: number | null;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  shippingEligible: boolean;
  internationalEligible: boolean;
};

export function VariantForm({
  productId,
  variant,
}: {
  productId: string;
  variant?: VariantFields;
}) {
  const isNew = !variant;
  return (
    <div className="border border-line bg-cream">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
            {isNew ? "Add a variant" : variant.name}
          </p>
          <p className="mt-0.5 text-[10px] text-ink-2">
            {isNew ? "A size or format with its own SKU and price." : variant.sku}
          </p>
        </div>
        {variant ? (
          <span className={`num border px-2 py-0.5 text-[10px] ${variant.stock === 0 ? "border-burgundy/30 text-burgundy" : "border-line text-ink-2"}`}>
            {variant.stock} in stock
          </span>
        ) : null}
      </div>

      <form action={saveVariantAction} className="p-4">
        <input type="hidden" name="productId" value={productId} />
        {variant ? <input type="hidden" name="variantId" value={variant.id} /> : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label" htmlFor={`name-${variant?.id ?? "new"}`}>Variant name</label>
            <input id={`name-${variant?.id ?? "new"}`} name="name" required defaultValue={variant?.name ?? "70 g bar"} className="field min-h-10 text-[12px]" />
          </div>
          <div>
            <label className="label" htmlFor={`sku-${variant?.id ?? "new"}`}>SKU</label>
            <input id={`sku-${variant?.id ?? "new"}`} name="sku" required defaultValue={variant?.sku ?? ""} className="field min-h-10 font-mono text-[11px] uppercase" placeholder="KC-C70-070" />
          </div>
          <div>
            <label className="label" htmlFor={`weight-${variant?.id ?? "new"}`}>Weight (g)</label>
            <input id={`weight-${variant?.id ?? "new"}`} name="weightGrams" type="number" min={1} required defaultValue={variant?.weightGrams ?? 70} className="field min-h-10 text-[12px]" />
          </div>
          <div>
            <label className="label" htmlFor={`price-${variant?.id ?? "new"}`}>Price (₹)</label>
            <input id={`price-${variant?.id ?? "new"}`} name="price" type="number" min={1} step="0.01" required defaultValue={variant ? minorToRupees(variant.priceMinor) : ""} className="field min-h-10 text-[12px]" />
          </div>
          <div>
            <label className="label" htmlFor={`compare-${variant?.id ?? "new"}`}>Compare at (₹)</label>
            <input id={`compare-${variant?.id ?? "new"}`} name="compareAt" type="number" min={0} step="0.01" defaultValue={variant?.compareAtMinor ? minorToRupees(variant.compareAtMinor) : ""} className="field min-h-10 text-[12px]" />
          </div>
          <div>
            <label className="label" htmlFor={`low-${variant?.id ?? "new"}`}>Low-stock at</label>
            <input id={`low-${variant?.id ?? "new"}`} name="lowStockThreshold" type="number" min={0} defaultValue={variant?.lowStockThreshold ?? 6} className="field min-h-10 text-[12px]" />
          </div>
          {isNew ? (
            <div>
              <label className="label" htmlFor="new-stock">Opening stock</label>
              <input id="new-stock" name="stock" type="number" min={0} defaultValue={0} className="field min-h-10 text-[12px]" />
            </div>
          ) : (
            <div className="flex items-end">
              <p className="hint mb-2">
                Stock changes only through <a href="/admin/inventory" className="underline">Inventory</a>.
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px]">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="active" defaultChecked={variant?.active ?? true} className="size-3.5 accent-[#75212f]" />
            Active on storefront
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="shippingEligible" defaultChecked={variant?.shippingEligible ?? true} className="size-3.5 accent-[#75212f]" />
            Courier/local eligible
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" name="internationalEligible" defaultChecked={variant?.internationalEligible ?? true} className="size-3.5 accent-[#75212f]" />
            International eligible
          </label>
        </div>

        <button type="submit" className="btn btn-outline btn-sm mt-3">
          <Save size={12} aria-hidden /> {isNew ? "Add variant" : "Save variant"}
        </button>
      </form>

      {variant && variant.active ? (
        <form action={deactivateVariantAction} className="border-t border-line px-4 py-2.5">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variant.id} />
          <ConfirmSubmit
            className="inline-flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.12em] text-ink-2 hover:text-burgundy"
            message={`Archive ${variant.name}? It will disappear from the storefront but its history remains.`}
          >
            <Archive size={12} aria-hidden /> Archive variant
          </ConfirmSubmit>
        </form>
      ) : null}
    </div>
  );
}
