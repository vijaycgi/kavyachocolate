import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { getSettings } from "@/lib/settings";

// Store content, prices and stock are database-backed and must not be baked at build time.
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();

  return (
    <CartProvider>
      <a
        href="#main"
        className="fixed left-3 top-3 z-[70] -translate-y-24 bg-burgundy px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-paper transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteHeader announcement={settings["store.announcement"]} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <CartDrawer />
    </CartProvider>
  );
}
