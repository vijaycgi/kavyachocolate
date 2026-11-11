import Link from "next/link";
import { ArrowRight, MapPin, PackageCheck, ReceiptText, ShieldAlert, UserRound } from "lucide-react";
import { AccountOrderCard } from "@/components/account/order-card";
import { ResendVerificationForm } from "@/components/account/resend-verification-form";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { getCustomerOrders } from "@/lib/orders";
import { formatDate } from "@/lib/money";
import { isOrderStatus, statusLabels } from "@/lib/validation";

type Search = { welcome?: string; verify?: string; verified?: string; saved?: string };

const activeStatuses = ["PLACED", "PROCESSING", "READY_FOR_PICKUP", "SHIPPED", "OUT_FOR_DELIVERY"];

export default async function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [params, customer] = await Promise.all([searchParams, requireCustomer()]);

  const [orders, totalOrders, activeOrders, addressCount, statusGroups] = await Promise.all([
    getCustomerOrders(customer.id, 3),
    prisma.order.count({ where: { customerId: customer.id } }),
    prisma.order.count({ where: { customerId: customer.id, status: { in: activeStatuses } } }),
    prisma.address.count({ where: { customerId: customer.id, orderId: null } }),
    prisma.order.groupBy({
      by: ["status"],
      where: { customerId: customer.id },
      _count: { _all: true },
    }),
  ]);

  const completed = statusGroups
    .filter((group) => group.status === "DELIVERED" || group.status === "COLLECTED")
    .reduce((sum, group) => sum + group._count._all, 0);
  const latest = orders[0];

  return (
    <div className="space-y-7">
      {params.welcome ? (
        <div
          role="status"
          className="border border-[#4f6144]/35 bg-[#4f6144]/10 px-4 py-3.5 text-[12.5px] leading-relaxed text-[#3c4b33]"
        >
          Your account is ready, {customer.name.split(" ")[0]}. {params.verify === "sent"
            ? "We sent a verification link to your email."
            : "Email delivery is not configured yet, so no verification message was sent. You can still order and use the account."}
        </div>
      ) : null}

      {params.verified ? (
        <div role="status" className="border border-[#4f6144]/35 bg-[#4f6144]/10 px-4 py-3.5 text-[12.5px] leading-relaxed text-[#3c4b33]">
          Email verified. Any earlier guest orders placed with this address are now in your history.
        </div>
      ) : null}

      {!customer.emailVerifiedAt ? (
        <section className="border border-brass/45 bg-brass/10 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-brass-ink" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6d512c]">
                Email not verified
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                Verify {customer.email} to secure the account and link earlier guest orders. Until
                then, only orders placed while signed in appear here.
              </p>
              <div className="mt-3">
                <ResendVerificationForm />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Orders", value: String(totalOrders), detail: "All time", icon: ReceiptText },
          { label: "In progress", value: String(activeOrders), detail: "Being prepared or delivered", icon: MapPin },
          { label: "Completed", value: String(completed), detail: "Delivered or collected", icon: PackageCheck },
          { label: "Addresses", value: String(addressCount), detail: "Saved for checkout", icon: UserRound },
        ].map((stat) => (
          <div key={stat.label} className="border border-line bg-cream p-4">
            <stat.icon size={15} className="text-burgundy" aria-hidden />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-2">
              {stat.label}
            </p>
            <p className="num mt-1 text-[1.75rem] font-semibold leading-none tracking-tight">
              {stat.value}
            </p>
            <p className="mt-1.5 text-[10.5px] text-ink-2">{stat.detail}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 className="font-display text-xl">Recent orders</h2>
            <p className="mt-0.5 text-[11.5px] text-ink-2">
              {latest ? `Last placed ${formatDate(latest.createdAt)}` : "No orders on this account yet."}
            </p>
          </div>
          <Link href="/account/orders" className="link-underline">
            All orders <ArrowRight size={12} aria-hidden />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-4 border border-dashed border-line bg-cream px-6 py-12 text-center">
            <p className="font-display text-2xl">The ledger is empty.</p>
            <p className="mx-auto mt-2 max-w-[44ch] text-[12.5px] leading-relaxed text-ink-2">
              Orders placed while signed in will appear here. Guest orders can be linked by
              verifying the same email.
            </p>
            <Link href="/shop" className="btn btn-primary mt-5">
              Browse the bars
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <AccountOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-line bg-cream p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
            Profile
          </h2>
          <p className="mt-2 font-display text-l text-ink">{customer.name}</p>
          <p className="text-[12px] text-ink-2">{customer.email}</p>
          {customer.phone ? <p className="text-[12px] text-ink-2">{customer.phone}</p> : null}
          <Link href="/account/profile" className="link-underline mt-4">
            Edit profile <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
        <div className="border border-line bg-cream p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
            Status at a glance
          </h2>
          {statusGroups.length === 0 ? (
            <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
              Status breakdown appears after your first order.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {statusGroups.map((group) => (
                <li key={group.status} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-ink-2">
                    {isOrderStatus(group.status) ? statusLabels[group.status] : group.status}
                  </span>
                  <span className="num font-medium">{group._count._all}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
