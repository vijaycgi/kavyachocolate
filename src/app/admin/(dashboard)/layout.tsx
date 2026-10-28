import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s · Kavya Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <AdminShell admin={{ name: admin.name, email: admin.email }}>{children}</AdminShell>
  );
}
