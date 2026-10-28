import type { ReactNode } from "react";
import { AlertTriangle, Check } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-line pb-6 md:flex-row md:items-end">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-ink">{eyebrow}</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.85rem)] leading-[1.06]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-[62ch] text-[13px] leading-relaxed text-ink-2">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`border p-4 ${emphasis ? "border-burgundy bg-burgundy text-paper" : "border-line bg-cream"}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${emphasis ? "text-paper/80" : "text-ink-2"}`}>
        {label}
      </p>
      <p className="num mt-2 text-[1.8rem] font-semibold leading-none tracking-tight">{value}</p>
      {detail ? (
        <p className={`mt-2 text-[12px] leading-snug ${emphasis ? "text-paper/80" : "text-ink-2"}`}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-line bg-cream px-6 py-14 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-ink-2">{copy}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Flash({ saved, error }: { saved?: string; error?: string }) {
  if (!saved && !error) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`mb-5 flex items-start gap-2.5 border px-4 py-3 text-[12.5px] leading-relaxed ${
        error
          ? "border-burgundy/35 bg-burgundy/5 text-burgundy"
          : "border-[#4f6144]/35 bg-[#4f6144]/10 text-[#3c4b33]"
      }`}
    >
      {error ? (
        <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <Check size={15} className="mt-0.5 shrink-0" aria-hidden />
      )}
      <span>{error ?? successText(saved ?? "")}</span>
    </div>
  );
}

function successText(saved: string) {
  const messages: Record<string, string> = {
    status: "Order status updated.",
    tracking: "Courier details saved.",
    note: "Note added to the order.",
    product: "Product saved.",
    variant: "Variant saved.",
    "variant-archived": "Variant archived. It will no longer appear on the storefront.",
    published: "Product published.",
    unpublished: "Product unpublished.",
    deleted: "Product deleted.",
    zone: "Shipping zone saved.",
    pickup: "Pickup location saved.",
    area: "Delivery area saved.",
    1: "Settings saved.",
    password: "Password changed. Other sessions have been signed out.",
  };
  return messages[saved] ?? "Saved.";
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {description ? <p className="mt-1 text-[12px] text-ink-2">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
