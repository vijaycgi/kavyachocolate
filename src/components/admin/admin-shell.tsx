"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  Store,
  Truck,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/auth-actions";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: { name: string; email: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string, exact?: boolean) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return `flex items-center gap-3 border-l-2 px-4 py-2.5 text-[12px] font-medium tracking-[0.02em] transition-colors ${
      active
        ? "border-brass bg-paper text-burgundy"
        : "border-transparent text-paper/80 hover:bg-paper/5 hover:text-paper"
    }`;
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-paper/15 px-5 py-5">
        <Link href="/admin" onClick={() => setOpen(false)} className="inline-block">
          <Image
            src="/images/kavya-chocolat-logo.svg"
            alt="Kavya Chocolat"
            width={84}
            height={49}
            className="h-10 w-auto brightness-0 invert"
          />
        </Link>
        <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-paper/75">
          Store operations
        </p>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-0.5 py-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={linkClass(item.href, item.exact)}
          >
            <item.icon size={15} strokeWidth={1.6} aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-paper/15 p-4">
        <p className="truncate text-[12px] font-medium text-paper">{admin.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-paper/75">{admin.email}</p>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="flex min-h-9 w-full items-center gap-2 border border-paper/25 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-paper/80 transition-colors hover:border-paper hover:text-paper"
          >
            <LogOut size={13} aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-burgundy lg:block">{sidebar}</aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-[3.6rem] items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="flex size-10 items-center justify-center border border-line text-ink lg:hidden"
              aria-label={open ? "Close admin menu" : "Open admin menu"}
              aria-expanded={open}
            >
              {open ? <X size={17} aria-hidden /> : <Menu size={17} aria-hidden />}
            </button>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-2">
              Kavya Chocolat · Admin
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-2 transition-colors hover:text-burgundy"
            >
              <Store size={13} aria-hidden /> View store
            </Link>
            <span className="hidden size-7 items-center justify-center rounded-full bg-burgundy text-[10px] font-semibold text-paper sm:flex">
              {admin.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </span>
          </div>
        </header>

        {open ? (
          <div className="bg-burgundy lg:hidden">{sidebar}</div>
        ) : null}

        <main className="px-4 py-7 sm:px-6 sm:py-9 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
