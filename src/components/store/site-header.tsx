"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/craft", label: "Our craft" },
  { href: "/track-order", label: "Track order" },
  { href: "/policies", label: "Policies" },
];

export function SiteHeader({ announcement }: { announcement: string }) {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const menuOpen = openForPath === pathname;

  return (
    <>
      <div className="bg-burgundy text-paper">
        <div className="page flex min-h-[2.15rem] items-center justify-center py-2">
          <p className="text-center text-[9.5px] font-medium uppercase leading-relaxed tracking-[0.14em] text-paper/90 sm:text-[10.5px] sm:leading-normal sm:tracking-[0.18em]">
            {announcement}
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur-md">
        <div className="page grid min-h-[4.75rem] grid-cols-[1fr_auto_1fr] items-center gap-3">
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {links.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] font-medium uppercase tracking-[0.17em] transition-colors hover:text-burgundy ${
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "text-burgundy"
                    : "text-ink-2"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setOpenForPath((current) => (current === pathname ? null : pathname))}
            className="flex size-11 items-center justify-center justify-self-start border border-line/70 text-ink lg:hidden"
          >
            {menuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>

          <Link href="/" className="justify-self-center" aria-label="Kavya Chocolat — home">
            <Image
              src="/images/kavya-chocolat-logo.svg"
              alt="Kavya Chocolat — premium handcrafted chocolate"
              width={84}
              height={49}
              loading="eager"
              className="h-10 w-auto sm:h-12"
            />
          </Link>

          <div className="flex items-center justify-end gap-1 sm:gap-3">
            <button
              type="button"
              onClick={openCart}
              className="group flex min-h-11 items-center gap-2 border-l border-line/70 pl-3 text-[11px] font-medium uppercase tracking-[0.17em] text-ink transition-colors hover:text-burgundy sm:pl-5"
              aria-label={`Open bag${count > 0 ? `, ${count} ${count === 1 ? "item" : "items"}` : ""}`}
            >
              <ShoppingBag size={17} strokeWidth={1.6} aria-hidden />
              <span className="hidden sm:inline">Bag</span>
              <span
                className={`num flex size-[1.15rem] items-center justify-center rounded-full text-[9px] ${
                  count > 0 ? "bg-burgundy text-paper" : "bg-paper-2 text-ink-2"
                }`}
                aria-hidden
              >
                {count}
              </span>
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-line bg-cream lg:hidden">
            <nav aria-label="Mobile" className="page grid gap-0 py-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpenForPath(null)}
                  className="border-b border-line/60 py-4 font-display text-2xl text-ink last:border-0"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/cart"
                onClick={() => setOpenForPath(null)}
                className="py-4 text-[11px] font-medium uppercase tracking-[0.17em] text-burgundy"
              >
                View bag ({count})
              </Link>
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}
