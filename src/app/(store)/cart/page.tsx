import type { Metadata } from "next";
import Link from "next/link";
import { CartView } from "@/components/store/cart-view";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the bars in your bag before checkout.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getSettings();

  return (
    <div className="page pb-20 pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="text-[10px] uppercase tracking-[0.14em] text-ink-2">
        <Link href="/shop" className="hover:text-burgundy">
          Shop
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">Bag</span>
      </nav>

      <div className="mt-5 border-b border-line pb-7">
        <p className="eyebrow">Almost there</p>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,5vw,4rem)] leading-[1.06]">
          Your bag.
        </h1>
      </div>

      <CartView email={settings["store.email"]} />
    </div>
  );
}
