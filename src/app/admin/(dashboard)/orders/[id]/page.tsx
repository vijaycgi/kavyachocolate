import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, Truck } from "lucide-react";
import {
  addOrderNoteAction,
  saveTrackingAction,
  updateOrderStatusAction,
} from "@/app/admin/(dashboard)/actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Flash } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/money";
import { fulfillmentLabels, type FulfillmentMethod } from "@/lib/fulfillment";
import {
  isOrderStatus,
  statusLabels,
  statusTransitions,
  type OrderStatus,
} from "@/lib/validation";

export const metadata = { title: "Order detail" };

type Search = { saved?: string; error?: string };

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { name: "asc" } },
      events: { orderBy: { createdAt: "desc" } },
      address: true,
      pickupLocation: true,
      customer: true,
    },
  });
  if (!order) notFound();

  const status: OrderStatus = isOrderStatus(order.status) ? order.status : "PLACED";
  const transitions = statusTransitions[status];
  const nextStatuses = transitions.filter((next) => next !== "CANCELLED");
  const canCancel = transitions.includes("CANCELLED");
  const method = order.fulfillmentMethod as FulfillmentMethod;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-2 hover:text-burgundy">
          <ArrowLeft size={13} aria-hidden /> All orders
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <span className="text-[10px] uppercase tracking-[0.12em] text-ink-2">
            Placed {formatDateTime(order.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">Order</p>
          <h1 className="mt-2 font-display text-3xl leading-[1.08] tracking-normal sm:text-4xl">{order.orderNumber}</h1>
          <p className="mt-2 text-[12.5px] text-ink-2">
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} bars ·{" "}
            {fulfillmentLabels[method] ?? order.fulfillmentMethod} ·{" "}
            <span className="num">{formatMoney(order.totalMinor)}</span>
          </p>
        </div>
        <div className="text-[11px] leading-relaxed text-ink-2 md:text-right">
          <p>No payment collected online.</p>
          <p>Arrange payment and confirm with the customer.</p>
        </div>
      </div>

      <Flash saved={query.saved} error={query.error} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          <section className="border border-line bg-cream">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">Items</h2>
              <span className="text-[10px] text-ink-2">Snapshot at order time</span>
            </div>
            <ul className="divide-y divide-line/70 px-4">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3.5">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink-2">
                      {item.variantName} · {item.sku} · Qty {item.quantity}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-2">
                      {formatMoney(item.unitPriceMinor)} each
                    </p>
                  </div>
                  <p className="num text-sm">{formatMoney(item.lineTotalMinor)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-4 py-4 text-[12.5px]">
              <div className="flex justify-between gap-4"><dt className="text-ink-2">Subtotal</dt><dd className="num">{formatMoney(order.subtotalMinor)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-2">Shipping</dt><dd className="num">{formatMoney(order.shippingMinor)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-2">{order.taxLabel}</dt><dd className="num">{formatMoney(order.taxMinor)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-line pt-2"><dt className="font-semibold">Total</dt><dd className="num font-semibold">{formatMoney(order.totalMinor)}</dd></div>
            </dl>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="border border-line bg-cream p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">Customer</h2>
              <p className="mt-3 font-medium">{order.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-2">
                <Mail size={12} aria-hidden />
                <a href={`mailto:${order.email}`} className="hover:text-burgundy">{order.email}</a>
              </p>
              {order.phone ? (
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-2">
                  <Phone size={12} aria-hidden />
                  <a href={`tel:${order.phone}`} className="hover:text-burgundy">{order.phone}</a>
                </p>
              ) : null}
              {order.customer ? (
                <p className="mt-3 border-t border-line pt-2 text-[10px] text-ink-2">
                  Customer record created {formatDateTime(order.customer.createdAt)}
                </p>
              ) : null}
            </div>

            <div className="border border-line bg-cream p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
                {method === "PICKUP" ? "Pickup" : "Delivery"}
              </h2>
              {method === "PICKUP" ? (
                <div className="mt-3 text-[12px] leading-relaxed text-ink-2">
                  <p className="font-medium text-ink">{order.pickupLocationName ?? "Studio pickup"}</p>
                  {order.pickupLocation ? (
                    <p className="mt-1">
                      {order.pickupLocation.addressLine}, {order.pickupLocation.city}{" "}
                      {order.pickupLocation.postalCode}
                    </p>
                  ) : null}
                  {order.pickupInstructions ? <p className="mt-2 text-[11px]">{order.pickupInstructions}</p> : null}
                </div>
              ) : order.address ? (
                <div className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-2">
                  <MapPin size={13} className="mt-0.5 shrink-0" aria-hidden />
                  <p>
                    {order.address.line1}
                    {order.address.line2 ? <>, {order.address.line2}</> : null}
                    <br />
                    {order.address.city}
                    {order.address.state ? `, ${order.address.state}` : ""} {order.address.postalCode}
                    <br />
                    {order.address.country}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-ink-2">No address stored.</p>
              )}
            </div>
          </section>

          {order.notes ? (
            <section className="border border-brass/40 bg-brass/5 p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#6d512c]">Customer note</h2>
              <p className="mt-2 text-[13px] leading-relaxed">{order.notes}</p>
            </section>
          ) : null}

          <section className="border border-line bg-cream">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">History</h2>
            </div>
            <ol className="divide-y divide-line/60 px-4">
              {order.events.map((event) => (
                <li key={event.id} className="grid grid-cols-[6.5rem_1fr] gap-3 py-3 text-[12px]">
                  <span className="text-[9.5px] uppercase tracking-[0.1em] text-ink-2">
                    {formatDateTime(event.createdAt)}
                  </span>
                  <div>
                    <p>{event.message}</p>
                    <p className="mt-0.5 text-[9.5px] uppercase tracking-[0.1em] text-ink-2">
                      {event.type} · {event.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <form action={addOrderNoteAction} className="border-t border-line p-4">
              <input type="hidden" name="orderId" value={order.id} />
              <label htmlFor="note" className="label">Add an internal note</label>
              <div className="flex flex-wrap gap-2">
                <input id="note" name="message" maxLength={500} required className="field min-h-10 flex-1 text-[12px]" placeholder="Called to confirm dispatch…" />
                <button type="submit" className="btn btn-outline btn-sm">Add note</button>
              </div>
              <p className="hint">Notes appear in this history only. They are not sent to the customer.</p>
            </form>
          </section>
        </div>

        <div className="space-y-4">
          <section className="border border-line bg-cream p-4">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">Fulfilment status</h2>
            {nextStatuses.length > 0 ? (
              <form action={updateOrderStatusAction} className="mt-3 space-y-2">
                <input type="hidden" name="orderId" value={order.id} />
                <label htmlFor="status" className="label">Move to</label>
                <select id="status" name="status" className="field min-h-10 text-[12px]" defaultValue={nextStatuses[0]}>
                  {nextStatuses.map((next) => (
                    <option key={next} value={next}>{statusLabels[next]}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary btn-sm w-full">Update status</button>
              </form>
            ) : (
              <p className="mt-3 border border-line bg-paper px-3 py-2 text-[11.5px] leading-relaxed text-ink-2">
                This order is {statusLabels[status].toLowerCase()} and has no further transitions.
              </p>
            )}

            {canCancel ? (
              <form action={updateOrderStatusAction} className="mt-4 border-t border-line pt-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="status" value="CANCELLED" />
                <ConfirmSubmit
                  className="btn btn-outline btn-sm w-full border-burgundy/40 text-burgundy hover:bg-burgundy hover:text-paper"
                  message="Cancel this order and restore its stock? This cannot be undone."
                >
                  Cancel order · restore stock
                </ConfirmSubmit>
              </form>
            ) : null}

            <p className="mt-3 text-[10px] leading-relaxed text-ink-2">
              Customer-facing page: share the receipt link from the order confirmation. No email is
              sent automatically.
            </p>
          </section>

          <section className="border border-line bg-cream p-4">
            <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
              <Truck size={13} aria-hidden /> Courier details
            </h2>
            <form action={saveTrackingAction} className="mt-3 space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label htmlFor="courier" className="label">Courier</label>
                <input id="courier" name="courier" defaultValue={order.courier ?? ""} className="field min-h-10 text-[12px]" />
              </div>
              <div>
                <label htmlFor="trackingNumber" className="label">Tracking number</label>
                <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="field min-h-10 text-[12px]" />
              </div>
              <div>
                <label htmlFor="trackingUrl" className="label">Tracking URL</label>
                <input id="trackingUrl" name="trackingUrl" type="url" defaultValue={order.trackingUrl ?? ""} placeholder="https://" className="field min-h-10 text-[12px]" />
              </div>
              <button type="submit" className="btn btn-outline btn-sm w-full">Save courier details</button>
            </form>
          </section>

          <section className="border border-line bg-cream p-4 text-[10.5px] leading-relaxed text-ink-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em]">Record</h2>
            <dl className="mt-3 space-y-2">
              <div><dt className="uppercase tracking-[0.1em]">Order ID</dt><dd className="break-all font-mono text-[10px] text-ink">{order.id}</dd></div>
              <div><dt className="uppercase tracking-[0.1em]">Currency</dt><dd className="text-ink">{order.currency}</dd></div>
              <div><dt className="uppercase tracking-[0.1em]">Created</dt><dd className="text-ink">{formatDateTime(order.createdAt)}</dd></div>
              <div><dt className="uppercase tracking-[0.1em]">Updated</dt><dd className="text-ink">{formatDateTime(order.updatedAt)}</dd></div>
              {order.cancelledAt ? <div><dt className="uppercase tracking-[0.1em]">Cancelled</dt><dd className="text-ink">{formatDateTime(order.cancelledAt)}</dd></div> : null}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
