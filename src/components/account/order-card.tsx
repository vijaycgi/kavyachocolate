import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Truck, Store } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatMoney } from "@/lib/money";
import { fulfillmentLabels, type FulfillmentMethod } from "@/lib/fulfillment";

type OrderCardData = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  status: string;
  totalMinor: number;
  currency: string;
  fulfillmentMethod: string;
  trackingNumber?: string | null;
  courier?: string | null;
  items: {
    id: string;
    name: string;
    variantName: string;
    quantity: number;
    lineTotalMinor: number;
    imageUrl: string;
  }[];
};

export function AccountOrderCard({ order }: { order: OrderCardData }) {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const method = order.fulfillmentMethod as FulfillmentMethod;
  const MethodIcon = method === "PICKUP" ? Store : Truck;
  const visible = order.items.slice(0, 2);

  return (
    <article className="border border-line bg-cream">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="font-mono text-[11.5px] font-semibold tracking-[0.04em] text-ink">
            {order.orderNumber}
          </p>
          <p className="text-[11px] text-ink-2">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="space-y-3">
          {visible.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden border border-line bg-paper-2">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">{item.name}</p>
                <p className="text-[10.5px] text-ink-2">
                  {item.variantName} · Qty {item.quantity} ·{" "}
                  <span className="num">{formatMoney(item.lineTotalMinor, order.currency)}</span>
                </p>
              </div>
            </div>
          ))}
          {order.items.length > 2 ? (
            <p className="pl-[3.75rem] text-[10.5px] text-ink-2">
              + {order.items.length - 2} more line{order.items.length - 2 === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-6 border-t border-line pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.12em] text-ink-2">
              {units} {units === 1 ? "bar" : "bars"}
            </p>
            <p className="num mt-0.5 text-[15px] font-semibold">
              {formatMoney(order.totalMinor, order.currency)}
            </p>
          </div>
          <Link
            href={`/account/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-burgundy hover:underline"
          >
            View order <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[10.5px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <MethodIcon size={12} aria-hidden />
          {fulfillmentLabels[method] ?? order.fulfillmentMethod}
        </span>
        {order.trackingNumber ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} aria-hidden /> {order.courier ?? "Courier"} · {order.trackingNumber}
          </span>
        ) : null}
        <span className="ml-auto text-[9.5px] uppercase tracking-[0.1em] text-ink-2/80">
          No payment collected online
        </span>
      </div>
    </article>
  );
}
