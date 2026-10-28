import Image from "next/image";
import Link from "next/link";
import { Save } from "lucide-react";
import { saveProductAction } from "@/app/admin/(dashboard)/actions";

type ProductFields = {
  id: string;
  name: string;
  slug: string;
  collection: string;
  tagline: string;
  description: string;
  story: string;
  ingredients: string;
  allergens: string;
  cocoaPercent: number | null;
  imageUrl: string;
  hoverImageUrl: string | null;
  featured: boolean;
  published: boolean;
  position: number;
};

const collections = [
  ["CLASSIC", "Classic"],
  ["DRY_FRUIT", "With dry fruits"],
  ["JAGGERY", "Jaggery-sweetened"],
  ["JAGGERY_DRY_FRUIT", "Jaggery + dry fruits"],
];

export function ProductForm({ product }: { product?: ProductFields }) {
  const isNew = !product;
  const defaultImage = product?.imageUrl ?? "/images/products/classic.jpg";

  return (
    <form action={saveProductAction} className="grid gap-5 xl:grid-cols-[1.5fr_0.5fr]">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="space-y-5">
        <section className="border border-line bg-cream p-4 sm:p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">The bar</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="label">Name</label>
              <input id="name" name="name" required defaultValue={product?.name ?? ""} className="field" placeholder="Classic 70% Dark Chocolate" />
            </div>
            <div>
              <label htmlFor="slug" className="label">URL slug</label>
              <input id="slug" name="slug" defaultValue={product?.slug ?? ""} className="field font-mono text-[12px]" placeholder="classic-70-dark-chocolate" />
              <p className="hint">Leave blank to generate from the name.</p>
            </div>
            <div>
              <label htmlFor="collection" className="label">Collection</label>
              <select id="collection" name="collection" defaultValue={product?.collection ?? "CLASSIC"} className="field">
                {collections.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="tagline" className="label">Tagline</label>
              <input id="tagline" name="tagline" defaultValue={product?.tagline ?? ""} maxLength={140} className="field" placeholder="Two ingredients. One honest bar." />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="label">Description</label>
              <textarea id="description" name="description" defaultValue={product?.description ?? ""} rows={4} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="story" className="label">Maker’s note</label>
              <textarea id="story" name="story" defaultValue={product?.story ?? ""} rows={3} className="field" />
              <p className="hint">Shown under “The bar” on the product page. Keep claims verifiable.</p>
            </div>
          </div>
        </section>

        <section className="border border-line bg-cream p-4 sm:p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
            Ingredients &amp; allergens
          </h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="ingredients" className="label">Ingredients</label>
              <textarea id="ingredients" name="ingredients" defaultValue={product?.ingredients ?? ""} rows={2} className="field" placeholder="Cocoa beans, sugar." />
            </div>
            <div>
              <label htmlFor="allergens" className="label">Allergens</label>
              <textarea id="allergens" name="allergens" defaultValue={product?.allergens ?? ""} rows={2} className="field" />
              <p className="hint">Pending declarations must say so. Do not invent certifications or health claims.</p>
            </div>
            <div className="max-w-[14rem]">
              <label htmlFor="cocoaPercent" className="label">Cocoa % <span className="normal-case tracking-normal text-ink-2">(optional)</span></label>
              <input id="cocoaPercent" name="cocoaPercent" type="number" min={0} max={100} defaultValue={product?.cocoaPercent ?? ""} className="field" />
              <p className="hint">Leave blank when the percentage is not verified.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="border border-line bg-cream p-4 sm:p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">Publishing</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-2.5 text-[12px] leading-snug">
              <input type="checkbox" name="published" defaultChecked={product?.published ?? true} className="mt-0.5 size-3.5 accent-[#75212f]" />
              <span><strong className="font-medium">Published</strong><br /><span className="text-[11px] text-ink-2">Visible on the storefront.</span></span>
            </label>
            <label className="flex items-start gap-2.5 text-[12px] leading-snug">
              <input type="checkbox" name="featured" defaultChecked={product?.featured ?? true} className="mt-0.5 size-3.5 accent-[#75212f]" />
              <span><strong className="font-medium">Featured</strong><br /><span className="text-[11px] text-ink-2">Included in the home collection.</span></span>
            </label>
            <div>
              <label htmlFor="position" className="label">Position</label>
              <input id="position" name="position" type="number" min={0} defaultValue={product?.position ?? 0} className="field min-h-10" />
            </div>
          </div>
        </section>

        <section className="border border-line bg-cream p-4 sm:p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">Photography</h2>
          <div className="relative mt-3 aspect-[4/5] overflow-hidden border border-line bg-paper-2">
            <Image src={defaultImage} alt="" fill sizes="240px" className="object-cover" />
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="imageUrl" className="label">Main image path</label>
              <input id="imageUrl" name="imageUrl" defaultValue={product?.imageUrl ?? "/images/products/classic.jpg"} className="field min-h-10 font-mono text-[11px]" />
            </div>
            <div>
              <label htmlFor="hoverImageUrl" className="label">Detail image path</label>
              <input id="hoverImageUrl" name="hoverImageUrl" defaultValue={product?.hoverImageUrl ?? ""} className="field min-h-10 font-mono text-[11px]" />
            </div>
            <p className="hint">Local paths under /public. Replace placeholder stock before launch.</p>
          </div>
        </section>

        <div className="border border-line bg-cream p-4">
          <button type="submit" className="btn btn-primary btn-sm w-full">
            <Save size={13} aria-hidden /> {isNew ? "Create product" : "Save product"}
          </button>
          <Link href="/admin/products" className="mt-2 block text-center text-[10px] uppercase tracking-[0.12em] text-ink-2 hover:text-burgundy">
            Back to products
          </Link>
        </div>
      </div>
    </form>
  );
}
