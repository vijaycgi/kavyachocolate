import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StoreSettings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: StoreSettings }) {
  return (
    <footer className="on-dark mt-24 bg-burgundy text-paper">
      <div className="page py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <Image
              src="/images/kavya-chocolat-logo.svg"
              alt="Kavya Chocolat"
              width={84}
              height={49}
              className="h-12 w-auto brightness-0 invert"
            />
            <p className="mt-7 max-w-[22ch] font-display text-3xl leading-[1.05] text-paper sm:text-4xl">
              Made slowly, in small batches.
            </p>
            <p className="mt-5 max-w-[38ch] text-sm leading-relaxed text-paper/80">
              Real cocoa beans, minimal ingredients, honest labels. Every bar is refined and
              tempered in our own kitchen.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/75">
                Shop
              </p>
              <ul className="space-y-2.5 text-sm text-paper/85">
                <li><Link className="hover:text-paper" href="/shop">All bars</Link></li>
                <li><Link className="hover:text-paper" href="/shop?collection=CLASSIC">Classic 70%</Link></li>
                <li><Link className="hover:text-paper" href="/shop?collection=DRY_FRUIT">With dry fruits</Link></li>
                <li><Link className="hover:text-paper" href="/shop?collection=JAGGERY">Jaggery-sweetened</Link></li>
                <li><Link className="hover:text-paper" href="/craft">Our craft</Link></li>
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/75">
                Help
              </p>
              <ul className="space-y-2.5 text-sm text-paper/85">
                <li><Link className="hover:text-paper" href="/track-order">Track an order</Link></li>
                <li><Link className="hover:text-paper" href="/policies#shipping">Shipping</Link></li>
                <li><Link className="hover:text-paper" href="/policies#returns">Returns</Link></li>
                <li><Link className="hover:text-paper" href="/policies#privacy">Privacy</Link></li>
                <li><Link className="hover:text-paper" href="/policies">All policies</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/75">
                Studio
              </p>
              <ul className="space-y-2.5 text-sm text-paper/85">
                <li>
                  <a className="hover:text-paper" href={`mailto:${settings["store.email"]}`}>
                    {settings["store.email"]}
                  </a>
                </li>
                <li>
                  <a className="hover:text-paper" href={`tel:${settings["store.phone"].replace(/\s/g, "")}`}>
                    {settings["store.phone"]}
                  </a>
                </li>
                <li className="text-paper/80">{settings["store.address"]}</li>
                <li>
                  <a
                    className="inline-flex items-center gap-1 hover:text-paper"
                    href={settings["store.instagram"]}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    Instagram <ArrowUpRight size={13} aria-hidden />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-paper/20 pt-6">
          <div className="flex flex-col gap-5 text-[11px] leading-relaxed text-paper/75 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[62ch] space-y-1.5">
              <p>
                Prices, weights and photography are placeholders until the launch catalogue is
                confirmed. Jaggery is unrefined cane sugar, not a sugar-free ingredient.
              </p>
              <p>
                No payment is collected online. We confirm every order by email or phone before
                dispatch.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span>© {new Date().getFullYear()} Kavya Chocolat</span>
              <Link href="/admin/login" className="text-paper/75 hover:text-paper">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
