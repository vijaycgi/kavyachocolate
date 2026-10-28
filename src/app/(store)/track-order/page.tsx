import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mail, PackageSearch } from "lucide-react";
import { getOrderForTracking } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Track an order",
  description:
    "Look up a Kavya Chocolat order with the order number and the email used at checkout.",
  alternates: { canonical: "/track-order" },
};

type Search = { order?: string; error?: string };

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;

  async function lookup(formData: FormData) {
    "use server";
    const orderNumber = String(formData.get("orderNumber") ?? "").trim().toUpperCase();
    const email = String(formData.get("email") ?? "").trim();

    if (!orderNumber || !email) {
      redirect(`/track-order?error=missing&order=${encodeURIComponent(orderNumber)}`);
    }

    const order = await getOrderForTracking(orderNumber, email);
    if (!order) {
      redirect(`/track-order?error=notfound&order=${encodeURIComponent(orderNumber)}`);
    }

    redirect(
      `/order-success?order=${encodeURIComponent(order.orderNumber)}&key=${encodeURIComponent(order.accessKey)}`,
    );
  }

  const errorMessage =
    params.error === "missing"
      ? "Enter both the order number and the email used at checkout."
      : params.error === "notfound"
        ? "No order matches that number and email. Check the confirmation page or write to us."
        : "";

  return (
    <div className="page pb-20 pt-10 sm:pt-14">
      <nav aria-label="Breadcrumb" className="text-[10px] uppercase tracking-[0.14em] text-ink-2">
        <Link href="/" className="hover:text-burgundy">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">Track order</span>
      </nav>

      <div className="mt-5 border-b border-line pb-8">
        <p className="eyebrow">Order status</p>
        <h1 className="mt-4 max-w-[17ch] font-display text-[clamp(2.7rem,5.4vw,4.5rem)] leading-[1.05]">
          Where is my chocolate?
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
          Enter the order number from your receipt and the email you used at checkout. No account
          needed.
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <form action={lookup} className="border border-line bg-cream p-5 sm:p-7">
          {errorMessage ? (
            <p
              role="alert"
              className="mb-4 border border-burgundy/30 bg-burgundy/5 px-3 py-2.5 text-[12.5px] leading-relaxed text-burgundy"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="label">
                Order number
              </label>
              <input
                id="orderNumber"
                name="orderNumber"
                required
                defaultValue={params.order ?? ""}
                placeholder="KC-261028-A1B2C3"
                autoComplete="off"
                spellCheck={false}
                className="field font-mono uppercase tracking-[0.06em]"
              />
              <p className="hint">It begins with KC- and appears on your receipt.</p>
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email used at checkout
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
                className="field"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary mt-6 w-full">
            Find my order <ArrowRight size={15} aria-hidden />
          </button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-2">
            For privacy, the lookup must match both the order number and email exactly.
          </p>
        </form>

        <div>
          <div className="border-t border-line pt-6">
            <p className="eyebrow">What the statuses mean</p>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              {[
                ["Placed", "Your order is saved. We have not collected payment."],
                ["Processing", "We are checking stock, packing and confirming the details."],
                ["Shipped / out for delivery", "It has left the studio, or is on a local route."],
                ["Ready for pickup", "Come to the studio within the agreed window."],
                ["Delivered / collected", "The chocolate is with you."],
              ].map(([label, copy]) => (
                <div key={label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink">
                    {label}
                  </dt>
                  <dd className="text-[12.5px] leading-relaxed text-ink-2">{copy}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-7 flex items-start gap-3 border border-line bg-paper-2 p-4">
            <PackageSearch size={18} className="mt-0.5 shrink-0 text-burgundy" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink">
                Order placed in another session?
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                The receipt link is the fastest route. If you have lost it, write to us with the
                order number and the email on the order.
              </p>
              <Link href="/policies#shipping" className="link-underline mt-3">
                Read shipping policy <ArrowRight size={12} aria-hidden />
              </Link>
            </div>
          </div>

          <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-ink-2">
            <Mail size={14} className="mt-0.5 shrink-0" aria-hidden />
            Automated email is not configured for this build. Keep the receipt page — it is the
            live record of your order.
          </p>
        </div>
      </div>
    </div>
  );
}
