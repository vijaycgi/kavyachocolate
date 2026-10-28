import { statusLabels, isOrderStatus } from "@/lib/validation";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  PLACED: "border-brass/50 bg-brass/10 text-[#6d512c]",
  PROCESSING: "border-burgundy/30 bg-burgundy/10 text-burgundy",
  READY_FOR_PICKUP: "border-brass/60 bg-brass/15 text-[#6d512c]",
  SHIPPED: "border-ink/20 bg-ink/5 text-ink",
  OUT_FOR_DELIVERY: "border-ink/20 bg-ink/5 text-ink",
  DELIVERED: "border-[#4f6144]/35 bg-[#4f6144]/10 text-[#3c4b33]",
  COLLECTED: "border-[#4f6144]/35 bg-[#4f6144]/10 text-[#3c4b33]",
  CANCELLED: "border-[#9b1c2c]/30 bg-[#9b1c2c]/10 text-[#8a1928]",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = isOrderStatus(status) ? statusLabels[status] : status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.13em]",
        tones[status] ?? "border-line bg-paper-2 text-ink-2",
        className,
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-current opacity-70"
      />
      {label}
    </span>
  );
}

