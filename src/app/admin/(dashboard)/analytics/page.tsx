import { PageHeader, StatCard } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { fulfillmentLabels, type FulfillmentMethod } from "@/lib/fulfillment";
import { statusLabels, type OrderStatus } from "@/lib/validation";

export const metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start }, status: { not: "CANCELLED" } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const revenue = orders.reduce((sum, order) => sum + order.totalMinor, 0);
  const units = orders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const aov = orders.length > 0 ? Math.round(revenue / orders.length) : 0;

  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - index));
    return { date, revenue: 0, orders: 0 };
  });

  for (const order of orders) {
    const orderDay = new Date(order.createdAt);
    orderDay.setHours(0, 0, 0, 0);
    const bucket = days.find((day) => day.date.getTime() === orderDay.getTime());
    if (bucket) {
      bucket.revenue += order.totalMinor;
      bucket.orders += 1;
    }
  }

  const maxDayRevenue = Math.max(1, ...days.map((day) => day.revenue));

  const statusCounts = new Map<string, number>();
  const fulfilmentCounts = new Map<string, number>();
  const productTotals = new Map<string, { name: string; units: number; revenue: number }>();

  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    fulfilmentCounts.set(
      order.fulfillmentMethod,
      (fulfilmentCounts.get(order.fulfillmentMethod) ?? 0) + 1,
    );
    for (const item of order.items) {
      const entry = productTotals.get(item.name) ?? { name: item.name, units: 0, revenue: 0 };
      entry.units += item.quantity;
      entry.revenue += item.lineTotalMinor;
      productTotals.set(item.name, entry);
    }
  }

  const topProducts = [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 4);
  const statusRows = [...statusCounts.entries()].sort((a, b) => b[1] - a[1]);
  const fulfilmentRows = [...fulfilmentCounts.entries()];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="The last thirty days."
        description="Live figures from placed orders, excluding cancellations. This is operational reporting, not accounting income; no payment has been collected online."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Order value" value={formatMoney(revenue)} detail="30 days · excludes cancelled" emphasis />
        <StatCard label="Orders" value={String(orders.length)} detail={`${units} bars ordered`} />
        <StatCard label="Average order" value={formatMoney(aov)} detail="Order value ÷ orders" />
        <StatCard
          label="Fulfilled"
          value={String(
            orders.filter((order) => order.status === "DELIVERED" || order.status === "COLLECTED")
              .length,
          )}
          detail="Delivered or collected in the period"
        />
      </div>

      <section className="border border-line bg-cream p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-3">
          <div>
            <h2 className="font-display text-xl">Daily order value</h2>
            <p className="mt-0.5 text-[11px] text-ink-2">Last 14 days · includes shipping, excludes cancelled</p>
          </div>
          <p className="num text-[11px] text-ink-2">Peak {formatMoney(maxDayRevenue)}</p>
        </div>

        <div
          className="mt-5 flex h-40 items-end gap-1.5 sm:gap-2"
          role="img"
          aria-label={`Daily order value for the last 14 days. Peak ${formatMoney(maxDayRevenue)}.`}
        >
          {days.map((day) => {
            const height = day.revenue > 0 ? Math.max(4, (day.revenue / maxDayRevenue) * 100) : 1.5;
            return (
              <div key={day.date.toISOString()} className="group flex h-full flex-1 flex-col justify-end gap-1">
                <div className="relative flex-1">
                  <div
                    className={`absolute bottom-0 w-full border-t border-burgundy/20 ${
                      day.revenue > 0 ? "bg-burgundy/80" : "bg-line/60"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${day.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${formatMoney(day.revenue)} · ${day.orders} orders`}
                  />
                </div>
                <span className="hidden text-center text-[8px] uppercase tracking-[0.04em] text-ink-2 sm:block">
                  {day.date.toLocaleDateString("en-IN", { day: "numeric" })}
                </span>
              </div>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <p className="mt-4 border-t border-line pt-3 text-[11.5px] text-ink-2">
            No orders in the last 30 days. The chart will fill as orders are placed.
          </p>
        ) : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="border border-line bg-cream p-4">
          <h2 className="border-b border-line pb-3 font-display text-xl">Order status</h2>
          {statusRows.length === 0 ? (
            <p className="py-6 text-[12px] text-ink-2">No orders to break down.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {statusRows.map(([status, count]) => {
                const share = Math.round((count / orders.length) * 100);
                return (
                  <li key={status} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11.5px]">
                        <span>{statusLabels[status as OrderStatus] ?? status}</span>
                        <span className="num text-ink-2">{count} · {share}%</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-paper-2">
                        <div className="h-full bg-burgundy/70" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border border-line bg-cream p-4">
          <h2 className="border-b border-line pb-3 font-display text-xl">How orders arrived</h2>
          {fulfilmentRows.length === 0 ? (
            <p className="py-6 text-[12px] text-ink-2">No fulfilment data yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line/60">
              {fulfilmentRows.map(([method, count]) => (
                <li key={method} className="flex items-center justify-between gap-3 py-2.5 text-[12px]">
                  <span>{fulfillmentLabels[method as FulfillmentMethod] ?? method}</span>
                  <span className="num text-ink-2">
                    {count} · {Math.round((count / orders.length) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-line pt-3 text-[10.5px] leading-relaxed text-ink-2">
            Cancellations are excluded from this view. They remain visible in the order ledger.
          </p>
        </section>
      </div>

      <section className="border border-line bg-cream">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
            Top bars by order value · 30 days
          </h2>
        </div>
        {topProducts.length === 0 ? (
          <p className="px-4 py-8 text-[12px] text-ink-2">No product sales in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[34rem]">
              <thead>
                <tr>
                  <th>Bar</th>
                  <th>Units</th>
                  <th>Order value</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.name}>
                    <td className="font-medium">{product.name}</td>
                    <td className="num">{product.units}</td>
                    <td className="num">{formatMoney(product.revenue)}</td>
                    <td className="num text-[11.5px] text-ink-2">
                      {revenue > 0 ? Math.round((product.revenue / revenue) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="border-t border-line pt-4 text-[10.5px] leading-relaxed text-ink-2">
        These numbers come from orders stored in this database. There is no analytics or
        advertising tracking on the storefront. Use the figures as an operations aid, not as a
        substitute for bookkeeping.
      </p>
    </div>
  );
}
