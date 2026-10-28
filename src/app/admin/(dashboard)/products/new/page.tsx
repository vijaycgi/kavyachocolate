import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { Flash } from "@/components/admin/ui";

export const metadata = { title: "New product" };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-2 hover:text-burgundy">
        <ArrowLeft size={13} aria-hidden /> Products
      </Link>
      <div className="border-b border-line pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">New product</p>
        <h1 className="mt-2 font-display text-3xl leading-[1.06] sm:text-4xl">Add a bar to the collection.</h1>
        <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-ink-2">
          Save the product first, then add at least one variant with a price and opening stock.
        </p>
      </div>
      <Flash error={error} />
      <ProductForm />
    </div>
  );
}
