import type { Metadata } from "next";
import Link from "next/link";
import { Check, MoveRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney, formatDateTime } from "@/lib/money";
import { getOrderByAccess } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { fulfillmentLabels, type FulfillmentMethod } from "@/lib/fulfillment";

export const metadata: Metadata = {
  title: "Order received",
  description: "Your Kavya Chocolat order details.",
  robots: { index: false, follow: false },
};

type Params = { order?: string; key?: string };

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const order =
    params.order && params.key
      ? await getOrderByAccess(params.order, params.key)
      : null;

  const settings = await getSettings();

  if (!order) {
    return (
      <div className="page py-20">
        <p className="eyebrow">Order lookup</p>
        <h1 className="mt-4 max-w-[18ch] font-display text-4xl leading-[1.08] sm:text-5xl">
          We could not find that order.
        </h1>
        <p className="mt-4 max-w-[50ch] text-sm leading-relaxed text-ink-2">
          The link may be incomplete. Look up the order with the order number and the email used
          at checkout.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/track-order" className="btn btn-primary">
            Track an order
          </Link>
          <Link href="/shop" className="btn btn-outline">
            Back to the collection
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const method = order.fulfillmentMethod as FulfillmentMethod;

  return (
    <div className="page pb-20 pt-10 sm:pt-14">
      <div className="border-b border-line pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">Order received</p>
          <StatusBadge status={order.status} />
        </div>
        <h1 className="mt-5 font-display text-[clamp(2.7rem,5.4vw,4.5rem)] leading-[1.05]">
          Thank you, {order.name.split(" ")[0]}.
        </h1>
        <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-ink-2">
          Your order is saved. No payment has been taken online — we will contact you at{" "}
          <strong className="font-medium text-ink">{order.email}</strong> to confirm the bars,
          delivery and payment.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-ink-2">
          <span>
            Order <strong className="font-semibold text-ink">{order.orderNumber}</strong>
          </span>
          <span>Placed {formatDateTime(order.createdAt)}</span>
          <span>{itemCount} {itemCount === 1 ? "bar" : "bars"}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14">
        <div className="space-y-8">
          <section className="border border-line bg-cream">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">
                The order
              </h2>
            </div>
            <ul className="divide-y divide-line/70 px-5">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <p className="text-[15px] font-medium leading-snug">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink-2">
                      {item.variantName} · {item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="num text-sm">{formatMoney(item.lineTotalMinor)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">Subtotal</dt>
                <dd className="num">{formatMoney(order.subtotalMinor)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">Shipping</dt>
                <dd className="num">
                  {order.shippingMinor === 0 ? "Free" : formatMoney(order.shippingMinor)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">{order.taxLabel}</dt>
                <dd className="num">{formatMoney(order.taxMinor)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-3">
                <dt className="font-display text-xl">Total</dt>
                <dd className="num text-lg font-semibold tracking-tight">{formatMoney(order.totalMinor)}</dd>
              </div>
            </dl>
            <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-ink-2">
              Total is due offline after we confirm the order. No payment has been collected.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="border border-line p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">
                {method === "PICKUP" ? "Pickup" : "Deliver to"}
              </h2>
              <div className="mt-3 text-[13px] leading-relaxed text-ink">
                <p className="font-medium">{order.name}</p>
                {method === "PICKUP" ? (
                  <>
                    <p className="mt-1">{order.pickupLocationName ?? "Studio pickup"}</p>
                    {order.pickupLocation ? (
                      <p className="text-ink-2">
                        {order.pickupLocation.addressLine}, {order.pickupLocation.city}{" "}
                        {order.pickupLocation.postalCode}
                      </p>
                    ) : null}
                    {order.pickupInstructions ? (
                      <p className="mt-2 text-[11px] text-ink-2">{order.pickupInstructions}</p>
                    ) : null}
                  </>
                ) : order.address ? (
                  <p className="mt-1 text-ink-2">
                    {order.address.line1}
                    {order.address.line2 ? <>, {order.address.line2}</> : null}
                    <br />
                    {order.address.city}
                    {order.address.state ? `, ${order.address.state}` : ""}{" "}
                    {order.address.postalCode}
                    <br />
                    {order.address.country}
                  </p>
                ) : null}
                <p className="mt-2 text-[11px] text-ink-2">{order.phone}</p>
              </div>
            </div>

            <div className="border border-line p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">
                Fulfilment
              </h2>
              <p className="mt-3 font-display text-xl">
                {fulfillmentLabels[method] ?? order.fulfillmentMethod}
              </p>
              {order.courier || order.trackingNumber ? (
                <div className="mt-2 text-[12px] leading-relaxed text-ink-2">
                  {order.courier ? <p>Courier: {order.courier}</p> : null}
                  {order.trackingNumber ? <p>Tracking: {order.trackingNumber}</p> : null}
                  {order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline underline-offset-2"
                    >
                      Open tracking
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
                  Tracking details appear here once the order is dispatched. You can return to
                  this link at any time.
                </p>
              )}
              <p className="mt-3 text-[11px] text-ink-2">
                Keep this page. It is your order receipt and tracking link.
              </p>
            </div>
          </section>

          <section className="border border-line p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">
              Order history
            </h2>
            <ol className="mt-4 space-y-3">
              {order.events.map((event) => (
                <li key={event.id} className="grid grid-cols-[1rem_1fr] gap-3 text-[12px]">
                  <span className="mt-1 flex size-4 items-center justify-center rounded-full border border-brass/60 bg-brass/10">
                    <Check size={9} className="text-brass" aria-hidden />
                  </span>
                  <div>
                    <p className="text-ink">{event.message}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-2">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="border border-line bg-cream p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">
              What happens next
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                ["We review the order", "We check the batch and the delivery area."],
                ["We contact you", `We write to ${order.email} to confirm payment and dispatch.`],
                ["It leaves the studio", method === "PICKUP" ? "We agree a pickup window." : "We pack and dispatch, or hand-deliver locally."],
              ].map(([title, copy], index) => (
                <li key={title} className="grid grid-cols-[1.5rem_1fr] gap-2.5">
                  <span className="num flex size-5 items-center justify-center rounded-full border border-burgundy/30 text-[9px] font-semibold text-burgundy">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-medium text-ink">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-2">{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-line pt-3 text-[10px] leading-relaxed text-ink-2">
              Automated email is not configured for this store yet. This page is the receipt;
              keep the link.
            </p>
          </div>

          <Link
            href="/track-order"
            className="flex items-center justify-between gap-4 border border-line p-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-ink"
          >
            Track this order <MoveRight size={15} aria-hidden />
          </Link>

          <div className="border border-line p-5 text-[12px] leading-relaxed text-ink-2">
            <p className="font-display text-lg text-ink">A question?</p>
            <p className="mt-2">
              Write to{" "}
              <a className="underline underline-offset-2" href={`mailto:${settings["store.email"]}`}>
                {settings["store.email"]}
              </a>{" "}
              with order {order.orderNumber}.
            </p>
          </div>

          <Link href="/shop" className="btn btn-outline w-full">
            Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
