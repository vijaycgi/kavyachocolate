import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Mail, MapPin, Truck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireCustomer } from "@/lib/customer-auth";
import { getCustomerOrder } from "@/lib/orders";
import { formatDateTime, formatMoney } from "@/lib/money";
import { fulfillmentLabels, type FulfillmentMethod } from "@/lib/fulfillment";
import { isOrderStatus, statusLabels } from "@/lib/validation";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [{ orderId }, customer] = await Promise.all([params, requireCustomer()]);
  // customerId is part of the query: changing the URL cannot reach another
  // customer's order, and the page simply renders a 404.
  const order = await getCustomerOrder(customer.id, orderId);
  if (!order) notFound();

  const method = order.fulfillmentMethod as FulfillmentMethod;
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const customerEvents = order.events.filter((event) => event.type !== "NOTE");
  const safeTrackingUrl =
    order.trackingUrl && /^https?:\/\//i.test(order.trackingUrl) ? order.trackingUrl : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-2 hover:text-burgundy"
        >
          <ArrowLeft size={13} aria-hidden /> All orders
        </Link>
        <StatusBadge status={order.status} />
      </div>

      <div className="border-b border-line pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brass-ink">
          Order {order.orderNumber}
        </p>
        <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.06]">
          {isOrderStatus(order.status)
            ? order.status === "CANCELLED"
              ? "This order was cancelled."
              : statusLabels[order.status] === "Placed"
                ? "Order received."
                : `${statusLabels[order.status]}.`
            : "Order detail."}
        </h2>
        <p className="mt-2 text-[12.5px] text-ink-2">
          Placed {formatDateTime(order.createdAt)} · {units} {units === 1 ? "bar" : "bars"} ·{" "}
          <span className="num">{formatMoney(order.totalMinor, order.currency)}</span>
        </p>
        <p className="mt-2 max-w-[62ch] text-[11.5px] leading-relaxed text-ink-2">
          No payment was collected online. We confirm stock, delivery and offline payment using the
          contact details on this order.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <section className="border border-line bg-cream">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
                Items
              </h3>
              <span className="text-[10px] text-ink-2">Prices at order time</span>
            </div>
            <ul className="divide-y divide-line/70 px-4">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-4">
                  <div className="relative size-14 shrink-0 overflow-hidden border border-line bg-paper-2">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium leading-snug text-ink">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink-2">
                      {item.variantName} · {item.sku}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-2">
                      <span className="num">{formatMoney(item.unitPriceMinor, item.currency)}</span>{" "}
                      each × {item.quantity}
                    </p>
                  </div>
                  <p className="num text-[13px] font-medium">
                    {formatMoney(item.lineTotalMinor, item.currency)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-4 py-4 text-[12.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">Subtotal</dt>
                <dd className="num">{formatMoney(order.subtotalMinor, order.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">Shipping</dt>
                <dd className="num">
                  {order.shippingMinor === 0
                    ? "Free"
                    : formatMoney(order.shippingMinor, order.currency)}
                </dd>
              </div>
              {order.discountMinor > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Discount</dt>
                  <dd className="num">
                    −{formatMoney(order.discountMinor, order.currency)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">{order.taxLabel}</dt>
                <dd className="num">{formatMoney(order.taxMinor, order.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-2">
                <dt className="font-semibold">Total due offline</dt>
                <dd className="num font-semibold">
                  {formatMoney(order.totalMinor, order.currency)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border border-line bg-cream p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
              {method === "PICKUP" ? "Collection" : "Delivery"}
            </h3>
            {method === "PICKUP" ? (
              <div className="mt-3 text-[12.5px] leading-relaxed">
                <p className="font-medium text-ink">{order.pickupLocationName ?? "Studio pickup"}</p>
                {order.pickupLocation ? (
                  <p className="mt-1 text-ink-2">
                    {order.pickupLocation.addressLine}, {order.pickupLocation.city}{" "}
                    {order.pickupLocation.postalCode}
                  </p>
                ) : null}
                {order.pickupInstructions ? (
                  <p className="mt-2 text-[11px] text-ink-2">{order.pickupInstructions}</p>
                ) : null}
              </div>
            ) : order.address ? (
              <div className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed">
                <MapPin size={14} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />
                <div>
                  <p className="font-medium text-ink">{order.address.name}</p>
                  <p className="text-ink-2">
                    {order.address.line1}
                    {order.address.line2 ? `, ${order.address.line2}` : ""}
                    <br />
                    {order.address.city}
                    {order.address.state ? `, ${order.address.state}` : ""}{" "}
                    {order.address.postalCode}
                    <br />
                    {order.address.country}
                  </p>
                  {order.address.phone ? (
                    <p className="mt-1 text-ink-2">{order.address.phone}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[12px] text-ink-2">No delivery address stored.</p>
            )}
            <p className="mt-3 border-t border-line pt-2 text-[11px] text-ink-2">
              {fulfillmentLabels[method] ?? order.fulfillmentMethod}
            </p>
          </section>

          {order.notes ? (
            <section className="border border-brass/40 bg-brass/5 p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6d512c]">
                Your note
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed">{order.notes}</p>
            </section>
          ) : null}

          <section className="border border-line bg-cream">
            <div className="border-b border-line px-4 py-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
                Status history
              </h3>
            </div>
            <ol className="space-y-3 px-4 py-4">
              {customerEvents.map((event) => (
                <li key={event.id} className="grid grid-cols-[1rem_1fr] gap-3 text-[12px]">
                  <span className="mt-0.5 flex size-4 items-center justify-center rounded-full border border-brass/60 bg-brass/10">
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
          <section className="border border-line bg-cream p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
              Tracking
            </h3>
            {order.courier || order.trackingNumber ? (
              <div className="mt-3 space-y-1 text-[12px] leading-relaxed text-ink-2">
                {order.courier ? <p>Courier: <span className="text-ink">{order.courier}</span></p> : null}
                {order.trackingNumber ? (
                  <p>Tracking: <span className="font-mono text-[11px] text-ink">{order.trackingNumber}</span></p>
                ) : null}
                {safeTrackingUrl ? (
                  <a
                    href={safeTrackingUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-block pt-1 text-burgundy underline underline-offset-2"
                  >
                    Open courier tracking
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
                Courier and tracking details appear here once the order is dispatched.
              </p>
            )}
            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-2 text-[10px] uppercase tracking-[0.1em] text-ink-2">
              <Truck size={12} aria-hidden />
              {fulfillmentLabels[method] ?? order.fulfillmentMethod}
            </p>
          </section>

          <section className="border border-line bg-cream p-4 text-[12px] leading-relaxed text-ink-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
              Contact
            </h3>
            <p className="mt-2">
              Reply to your order confirmation or write to us with the order number. Include{" "}
              <strong className="font-mono text-[11px] text-ink">{order.orderNumber}</strong>.
            </p>
            <a
              href={`mailto:${order.email}?subject=${encodeURIComponent(`Order ${order.orderNumber}`)}`}
              className="mt-3 inline-flex items-center gap-1.5 text-burgundy underline underline-offset-2"
            >
              <Mail size={12} aria-hidden /> Email about this order
            </a>
          </section>

          <Link href="/shop" className="btn btn-outline w-full">
            Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
