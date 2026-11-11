import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="page pb-20 pt-8 sm:pt-12">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-2 transition-colors hover:text-burgundy"
      >
        <ArrowLeft size={12} aria-hidden /> Back to the collection
      </Link>

      <div className="mt-6 grid gap-8 border-t border-line pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <aside className="order-2 lg:order-1">
          <div className="border border-line bg-burgundy p-6 text-paper sm:p-8">
            <Link href="/" aria-label="Kavya Chocolat — home" className="inline-block">
              <Image
                src="/images/kavya-chocolat-logo.svg"
                alt="Kavya Chocolat"
                width={84}
                height={49}
                className="h-11 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/70">
              The account book
            </p>
            <p className="mt-4 max-w-[24ch] font-display text-[clamp(1.8rem,3vw,2.5rem)] leading-[1.08]">
              Keep your orders in one quiet place.
            </p>
            <ul className="mt-6 space-y-2.5 text-[12.5px] leading-relaxed text-paper/80">
              <li>Order history, receipts and live fulfilment status.</li>
              <li>Saved delivery addresses for faster checkout.</li>
              <li>No payment details — we never collect them.</li>
            </ul>
            <p className="mt-8 border-t border-paper/20 pt-4 text-[10.5px] leading-relaxed text-paper/65">
              Guest checkout remains available. An account simply keeps the record.
            </p>
          </div>
        </aside>

        <div className="order-1 min-w-0 lg:order-2">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 max-w-[18ch] font-display text-[clamp(2.3rem,4.2vw,3.5rem)] leading-[1.05]">
            {title}
          </h1>
          <div className="mt-4 max-w-[48ch] text-[13.5px] leading-relaxed text-ink-2">
            {description}
          </div>
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 border-t border-line pt-5 text-[12px] text-ink-2">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
