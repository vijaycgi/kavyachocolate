import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/money";

export const metadata = { title: { absolute: "Overview · Kavya Admin" } };

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const firstName = admin.name.split(" ")[0] || "there";
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    newOrders,
    revenue30,
    orders30,
    customers,
    lowStockAll,
    recentOrders,
    statusGroups,
  ] = await Promise.all([
    prisma.order.count({ where: { status: "PLACED" } }),
    prisma.order.aggregate({
      _sum: { totalMinor: true },
      where: { status: { not: "CANCELLED" }, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.customer.count(),
    prisma.variant.findMany({
      where: { active: true },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { stock: "asc" },
    }),
    prisma.order.findMany({
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  const lowStock = lowStockAll.filter((variant) => variant.stock <= variant.lowStockThreshold).slice(0, 6);
  const outOfStock = lowStockAll.filter((variant) => variant.stock === 0).length;
  const revenue = revenue30._sum.totalMinor ?? 0;
  const aov = orders30 > 0 ? Math.round(revenue / orders30) : 0;
  const openCount = statusGroups
    .filter((group) => ["PLACED", "PROCESSING", "READY_FOR_PICKUP"].includes(group.status))
    .reduce((sum, group) => sum + group._count._all, 0);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Store operations"
        title={`Good morning, ${firstName}.`}
        description="Live orders, stock and fulfilment from the database. Nothing here is sample data."
        actions={
          <>
            <Link href="/" target="_blank" className="btn btn-outline btn-sm">
              View store
            </Link>
            <Link href="/admin/orders" className="btn btn-primary btn-sm">
              Manage orders <ArrowRight size={13} aria-hidden />
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New orders"
          value={String(newOrders)}
          detail="Placed and not yet moved to processing"
          emphasis={newOrders > 0}
        />
        <StatCard
          label="Revenue · 30 days"
          value={formatMoney(revenue)}
          detail={`${orders30} orders · ${formatMoney(aov)} average`}
        />
        <StatCard
          label="Open fulfilment"
          value={String(openCount)}
          detail="Placed, processing or waiting for pickup"
        />
        <StatCard
          label="Low stock"
          value={String(lowStockAll.filter((variant) => variant.stock <= variant.lowStockThreshold).length)}
          detail={outOfStock > 0 ? `${outOfStock} variant${outOfStock === 1 ? "" : "s"} sold out` : "No sold-out variants"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="min-w-0 border border-line bg-cream">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
              Recent orders
            </h2>
            <Link href="/admin/orders" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-burgundy hover:underline">
              All orders
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No orders yet."
                copy="Once a customer places an order, it will appear here. No payment is collected online, so every order starts as Placed."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-[40rem]">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Placed</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-burgundy hover:underline">
                          {order.orderNumber}
                        </Link>
                        <span className="ml-1.5 text-[10px] text-ink-2">
                          {order._count.items} item{order._count.items === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td>
                        <p className="font-medium">{order.name}</p>
                        <p className="text-[11px] text-ink-2">{order.email}</p>
                      </td>
                      <td className="whitespace-nowrap text-[12px] text-ink-2">{formatDate(order.createdAt)}</td>
                      <td className="num whitespace-nowrap">{formatMoney(order.totalMinor)}</td>
                      <td><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="min-w-0 border border-line bg-cream">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
              Stock to watch
            </h2>
            <Link href="/admin/inventory" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-burgundy hover:underline">
              Inventory
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Stock looks healthy."
                copy="No active variant is at or below its low-stock threshold."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line/70">
              {lowStock.map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/products/${variant.productId}`} className="block truncate text-[12.5px] font-medium hover:text-burgundy">
                      {variant.product.name}
                    </Link>
                    <p className="truncate text-[10.5px] text-ink-2">
                      {variant.name} · {variant.sku}
                    </p>
                  </div>
                  <span
                    className={`num shrink-0 border px-2 py-1 text-[10px] font-semibold ${
                      variant.stock === 0
                        ? "border-burgundy/30 bg-burgundy/5 text-burgundy"
                        : "border-brass/40 bg-brass/10 text-[#6d512c]"
                    }`}
                  >
                    {variant.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/products", title: "Add or edit bars", copy: "Prices, variants, copy and publish state.", icon: "01" },
          { href: "/admin/shipping", title: "Tune fulfilment", copy: "Zones, local areas, pickup windows and fees.", icon: "02" },
          { href: "/admin/settings", title: "Store settings", copy: "Contact details, policies, tax and free shipping.", icon: "03" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start justify-between gap-4 border border-line bg-cream p-4 transition-colors hover:border-ink"
          >
            <div>
              <p className="num text-[11px] font-semibold tracking-[0.16em] text-brass-ink">{item.icon}</p>
              <p className="mt-2 font-display text-xl">{item.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{item.copy}</p>
            </div>
            <PackageOpen size={16} className="mt-1 shrink-0 text-ink-2 transition-colors group-hover:text-burgundy" aria-hidden />
          </Link>
        ))}
      </div>

      <p className="border-t border-line pt-4 text-[10.5px] leading-relaxed text-ink-2">
        Customer count: {customers}. Dashboard figures are calculated from live orders and exclude
        cancelled orders from revenue. No payment data is stored in this system.
      </p>
    </div>
  );
}
