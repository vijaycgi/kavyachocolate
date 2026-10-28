import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState, Flash, PageHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { formatDateTime, formatMoney } from "@/lib/money";
import { isOrderStatus, statusLabels, orderStatuses } from "@/lib/validation";
import { fulfillmentLabels, type FulfillmentMethod } from "@/lib/fulfillment";

export const metadata = { title: "Orders" };

type SearchParams = { status?: string; q?: string; page?: string; saved?: string; error?: string };

const PAGE_SIZE = 25;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const status = params.status && isOrderStatus(params.status) ? params.status : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query } },
            { email: { contains: query.toLowerCase() } },
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : {}),
  };

  const [orders, total, groups] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const counts = new Map(groups.map((group) => [group.status, group._count._all]));
  const allCount = groups.reduce((sum, group) => sum + group._count._all, 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (next: Partial<SearchParams>) => {
    const search = new URLSearchParams();
    const merged = { status, q: query, ...next };
    if (merged.status) search.set("status", merged.status);
    if (merged.q) search.set("q", merged.q);
    if (merged.page && merged.page !== "1") search.set("page", merged.page);
    const string = search.toString();
    return string ? `/admin/orders?${string}` : "/admin/orders";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Orders"
        title="Every order, one ledger."
        description="Orders are placed without online payment. Move each one through fulfilment and record courier details as they happen."
      />

      <Flash saved={params.saved} error={params.error} />

      <div className="flex flex-col gap-3 border-b border-line pb-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link
            href={link({ status: "", page: "1" })}
            className={`border-b pb-1 text-[10px] font-semibold uppercase tracking-[0.13em] ${
              status === "" ? "border-burgundy text-burgundy" : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            All <span className="num ml-1">{allCount}</span>
          </Link>
          {orderStatuses.map((value) => (
            <Link
              key={value}
              href={link({ status: value, page: "1" })}
              className={`border-b pb-1 text-[10px] font-semibold uppercase tracking-[0.13em] ${
                status === value ? "border-burgundy text-burgundy" : "border-transparent text-ink-2 hover:text-ink"
              }`}
            >
              {statusLabels[value]} <span className="num ml-1">{counts.get(value) ?? 0}</span>
            </Link>
          ))}
        </div>

        <form action="/admin/orders" method="get" className="flex flex-wrap items-center gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="order-search" className="sr-only">Search orders</label>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden />
            <input
              id="order-search"
              name="q"
              defaultValue={query}
              placeholder="Order number, name, email, phone"
              className="field min-h-10 w-[19rem] max-w-full pl-8 text-[12px]"
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">Search</button>
          {query ? (
            <Link href={link({ q: "", page: "1" })} className="text-[10px] uppercase tracking-[0.12em] text-ink-2 hover:text-burgundy">
              Clear
            </Link>
          ) : null}
          <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-ink-2">
            {total} order{total === 1 ? "" : "s"}
          </span>
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title={query || status ? "No orders match that filter." : "No orders yet."}
          copy={
            query || status
              ? "Try clearing the search or choosing a different status."
              : "Orders placed on the storefront will appear here with live stock and totals."
          }
          action={
            query || status ? (
              <Link href="/admin/orders" className="btn btn-outline btn-sm">Clear filters</Link>
            ) : (
              <Link href="/" target="_blank" className="btn btn-outline btn-sm">Open storefront</Link>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto border border-line bg-cream">
          <table className="data-table min-w-[58rem]">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Customer</th>
                <th>Fulfilment</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-burgundy hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-[11.5px] text-ink-2">{formatDateTime(order.createdAt)}</td>
                  <td>
                    <p className="font-medium">{order.name}</p>
                    <p className="text-[11px] text-ink-2">{order.email}</p>
                  </td>
                  <td className="text-[11.5px] text-ink-2">
                    {fulfillmentLabels[order.fulfillmentMethod as FulfillmentMethod] ?? order.fulfillmentMethod}
                  </td>
                  <td className="num text-[12px]">{order._count.items}</td>
                  <td className="num whitespace-nowrap">{formatMoney(order.totalMinor)}</td>
                  <td><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <Link
            href={link({ page: String(Math.max(1, page - 1)) })}
            aria-disabled={page <= 1}
            className={`btn btn-outline btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Previous
          </Link>
          <p className="text-[10px] uppercase tracking-[0.12em] text-ink-2">
            Page {page} of {pageCount}
          </p>
          <Link
            href={link({ page: String(Math.min(pageCount, page + 1)) })}
            aria-disabled={page >= pageCount}
            className={`btn btn-outline btn-sm ${page >= pageCount ? "pointer-events-none opacity-40" : ""}`}
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  );
}
