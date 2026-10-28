export function formatMoney(minor: number, currency = "INR") {
  const hasPaise = Math.abs(minor) % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(minor / 100);
}

/** Accepts "480", "480.00", "₹480" and returns integer paise. */
export function rupeesToMinor(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return 0;
  return Math.round(Number(cleaned) * 100);
}

export function minorToRupees(minor: number): string {
  return (minor / 100).toFixed(2).replace(/\.00$/, "");
}

export function formatWeight(grams: number) {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`;
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}
