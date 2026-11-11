import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState, Flash, PageHeader, StatCard } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/money";

export const metadata = { title: "Customers" };

type Search = { q?: string; saved?: string; error?: string };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query.toLowerCase() } },
            { phone: { contains: query } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Guest orders deliberately keep customerId null until the address is
  // verified, so order history is grouped by the stored order email.
  const [orderTotals, validTotals, totalCustomers] = await Promise.all([
    prisma.order.groupBy({
      by: ["email"],
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.order.groupBy({
      by: ["email"],
      where: { status: { not: "CANCELLED" } },
      _sum: { totalMinor: true },
    }),
    prisma.customer.count(),
  ]);

  const countByEmail = new Map(
    orderTotals.map((row) => [
      row.email.toLowerCase(),
      { count: row._count._all, lastOrder: row._max.createdAt },
    ]),
  );
  const spendByEmail = new Map(
    validTotals.map((row) => [row.email.toLowerCase(), row._sum.totalMinor ?? 0]),
  );
  const revenue = validTotals.reduce((sum, row) => sum + (row._sum.totalMinor ?? 0), 0);
  const repeat = customers.filter(
    (customer) => (countByEmail.get(customer.email.toLowerCase())?.count ?? 0) > 1,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customers"
        title="Who orders the chocolate."
        description="Customer records are created by guest checkout and by account registration. Guest orders stay grouped by email until the customer verifies the address."
      />

      <Flash saved={params.saved} error={params.error} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Customers" value={String(totalCustomers)} detail="Accounts and guest records" />
        <StatCard label="Repeat customers" value={String(repeat)} detail="More than one order" />
        <StatCard label="Revenue · listed" value={formatMoney(revenue)} detail="Excludes cancelled orders" />
      </div>

      <form action="/admin/customers" method="get" className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <label htmlFor="customer-search" className="sr-only">Search customers</label>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden />
          <input
            id="customer-search"
            name="q"
            defaultValue={query}
            placeholder="Name, email or phone"
            className="field min-h-10 w-[18rem] max-w-full pl-8 text-[12px]"
          />
        </div>
        <button type="submit" className="btn btn-outline btn-sm">Search</button>
        {query ? (
          <Link href="/admin/customers" className="text-[10px] uppercase tracking-[0.12em] text-ink-2 hover:text-burgundy">
            Clear
          </Link>
        ) : null}
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title={query ? "No customer matches that search." : "No customers yet."}
          copy={
            query
              ? "Try a shorter search or clear the filter."
              : "The first guest checkout creates a customer record automatically."
          }
          action={query ? <Link href="/admin/customers" className="btn btn-outline btn-sm">Clear search</Link> : undefined}
        />
      ) : (
        <div className="overflow-x-auto border border-line bg-cream">
          <table className="data-table min-w-[48rem]">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Last order</th>
                <th>First seen</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const key = customer.email.toLowerCase();
                const stats = countByEmail.get(key);
                return (
                  <tr key={customer.id}>
                    <td>
                      <p className="font-medium">
                        {customer.name}
                        {customer.passwordHash || customer.emailVerifiedAt ? (
                          <span className="ml-2 align-middle text-[9px] font-semibold uppercase tracking-[0.1em] text-brass-ink">
                            Account
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-ink-2">
                        <a href={`mailto:${customer.email}`} className="hover:text-burgundy">{customer.email}</a>
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </p>
                    </td>
                    <td>
                      <Link href={`/admin/orders?q=${encodeURIComponent(customer.email)}`} className="num text-burgundy hover:underline">
                        {stats?.count ?? 0}
                      </Link>
                    </td>
                    <td className="num">{formatMoney(spendByEmail.get(key) ?? 0)}</td>
                    <td className="text-[11.5px] text-ink-2">
                      {stats?.lastOrder ? formatDate(stats.lastOrder) : "—"}
                    </td>
                    <td className="text-[11.5px] text-ink-2">{formatDate(customer.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10.5px] leading-relaxed text-ink-2">
        Revenue is based on all orders grouped by email and excludes cancellations. Customer data
        should be handled according to the privacy policy and applicable law.
      </p>
    </div>
  );
}
