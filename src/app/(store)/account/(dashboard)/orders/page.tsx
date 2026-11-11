import Link from "next/link";
import { AccountOrderCard } from "@/components/account/order-card";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { orderStatuses, statusLabels, isOrderStatus } from "@/lib/validation";

const PAGE_SIZE = 10;

type Search = { status?: string; page?: string };

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [params, customer] = await Promise.all([searchParams, requireCustomer()]);
  const status = params.status && isOrderStatus(params.status) ? params.status : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = { customerId: customer.id, ...(status ? { status } : {}) };
  const [orders, total, groups] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: { orderBy: { name: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ["status"],
      where: { customerId: customer.id },
      _count: { _all: true },
    }),
  ]);

  const counts = new Map(groups.map((group) => [group.status, group._count._all]));
  const allCount = groups.reduce((sum, group) => sum + group._count._all, 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (nextStatus: string, nextPage = 1) => {
    const search = new URLSearchParams();
    if (nextStatus) search.set("status", nextStatus);
    if (nextPage > 1) search.set("page", String(nextPage));
    const query = search.toString();
    return query ? `/account/orders?${query}` : "/account/orders";
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="font-display text-2xl">Order history</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          Every order keeps the prices, names and options recorded when it was placed. No payment
          is collected online on any order.
        </p>
      </div>

      {allCount === 0 ? (
        <div className="border border-dashed border-line bg-cream px-6 py-14 text-center">
          <p className="font-display text-2xl">No orders yet.</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-[12.5px] leading-relaxed text-ink-2">
            When you order while signed in, the bars and their fulfilment status will appear here.
          </p>
          <Link href="/shop" className="btn btn-primary mt-5">
            Shop the collection
          </Link>
        </div>
      ) : (
        <>
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
            <Link
              href={href("")}
              aria-current={!status ? "page" : undefined}
              className={`whitespace-nowrap border-b px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] ${
                !status ? "border-burgundy text-burgundy" : "border-transparent text-ink-2 hover:text-ink"
              }`}
            >
              All <span className="num ml-1">{allCount}</span>
            </Link>
            {orderStatuses.map((value) => (
              <Link
                key={value}
                href={href(value)}
                aria-current={status === value ? "page" : undefined}
                className={`whitespace-nowrap border-b px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] ${
                  status === value
                    ? "border-burgundy text-burgundy"
                    : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                {statusLabels[value]} <span className="num ml-1">{counts.get(value) ?? 0}</span>
              </Link>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="border border-dashed border-line bg-cream px-6 py-12 text-center">
              <p className="font-display text-xl">No orders with that status.</p>
              <Link href="/account/orders" className="btn btn-outline btn-sm mt-4">
                Show all orders
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <AccountOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}

          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Link
                href={href(status, Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={`btn btn-outline btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
              >
                Previous
              </Link>
              <p className="text-[10px] uppercase tracking-[0.12em] text-ink-2">
                Page {page} of {pageCount}
              </p>
              <Link
                href={href(status, Math.min(pageCount, page + 1))}
                aria-disabled={page >= pageCount}
                className={`btn btn-outline btn-sm ${page >= pageCount ? "pointer-events-none opacity-40" : ""}`}
              >
                Next
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
