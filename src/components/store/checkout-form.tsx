"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, LockKeyhole } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/money";
import type { FulfillmentMethod } from "@/lib/fulfillment";
import {
  checkoutSchema,
  fieldErrorsFromZod,
  firstFieldError,
  type FieldErrors,
} from "@/lib/validation";

type CountryOption = { code: string; name: string };
type PickupOption = {
  id: string;
  name: string;
  addressLine: string;
  city: string;
  postalCode: string;
  hours: string;
  instructions: string;
  phone: string | null;
};

type SavedAddress = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Quote = {
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  label: string;
  eta: string;
  freeOverMinor?: number;
  key: string;
};

const CHECKOUT_KEY = "kavya-checkout-key";

function ErrorLine({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="error-text">
      {message}
    </p>
  );
}

const fieldIds: Record<string, string> = {
  name: "name",
  email: "email",
  phone: "phone",
  notes: "notes",
  pickupLocationId: "pickup",
  "address.line1": "line1",
  "address.line2": "line2",
  "address.city": "city",
  "address.state": "state",
  "address.postalCode": "postalCode",
  "address.country": "country",
  items: "checkout-form",
};

const methods: { value: FulfillmentMethod; title: string; copy: string }[] = [
  {
    value: "SHIP",
    title: "Courier shipping",
    copy: "Delivered to your door across India and selected countries.",
  },
  {
    value: "LOCAL",
    title: "Local delivery",
    copy: "Hand-delivered in Bengaluru by postal-code area.",
  },
  {
    value: "PICKUP",
    title: "Studio pickup",
    copy: "Collect from the studio by arrangement. No delivery fee.",
  },
];

export function CheckoutForm({
  countries,
  pickups,
  pickupNote,
  taxLabel,
  account,
  savedAddress,
}: {
  countries: CountryOption[];
  pickups: PickupOption[];
  pickupNote: string;
  taxLabel: string;
  account?: { name: string; email: string; phone: string } | null;
  savedAddress?: SavedAddress | null;
}) {
  const router = useRouter();
  const { lines, hydrated, subtotalMinor, clear } = useCart();
  const keyRef = useRef("");
  const [form, setForm] = useState(() => ({
    name: account?.name || savedAddress?.name || "",
    email: account?.email ?? "",
    phone: account?.phone || savedAddress?.phone || "",
    notes: "",
    method: "SHIP" as FulfillmentMethod,
    country: savedAddress?.country || countries[0]?.code || "IN",
    line1: savedAddress?.line1 ?? "",
    line2: savedAddress?.line2 ?? "",
    city: savedAddress?.city ?? "",
    state: savedAddress?.state ?? "",
    postalCode: savedAddress?.postalCode ?? "",
    pickupLocationId: pickups[0]?.id ?? "",
  }));
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<{ key: string; message: string } | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const itemsKey = lines.map((line) => `${line.variantId}:${line.quantity}`).join("|");
  const requestKey = `${form.method}|${form.country}|${form.postalCode.trim()}|${itemsKey}`;

  useEffect(() => {
    let key = "";
    try {
      key = window.sessionStorage.getItem(CHECKOUT_KEY) ?? "";
      if (!key) {
        key =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `kc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.sessionStorage.setItem(CHECKOUT_KEY, key);
      }
    } catch {
      key = `kc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    keyRef.current = key;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) return;
    if (form.method === "PICKUP") return;
    if (!form.country || !form.postalCode.trim()) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const response = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            method: form.method,
            country: form.country,
            postalCode: form.postalCode,
            items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setQuote(null);
          setQuoteError({
            key: requestKey,
            message: data.error ?? "We could not calculate delivery for that address.",
          });
          return;
        }
        setQuote({ ...data, key: requestKey });
        setQuoteError(null);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setQuote(null);
          setQuoteError({
            key: requestKey,
            message: "We could not reach the server to calculate delivery.",
          });
        }
      } finally {
        setQuoteLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [hydrated, requestKey, form.method, form.country, form.postalCode, itemsKey, lines]);

  const selectedPickup = useMemo(
    () => pickups.find((pickup) => pickup.id === form.pickupLocationId) ?? pickups[0],
    [pickups, form.pickupLocationId],
  );

  const pickupQuote: Quote | null =
    form.method === "PICKUP"
      ? {
          key: requestKey,
          subtotalMinor,
          shippingMinor: 0,
          totalMinor: subtotalMinor,
          label: "Studio pickup",
          eta: "Usually ready within 48 hours",
        }
      : null;
  const activeQuote = pickupQuote ?? (quote?.key === requestKey ? quote : null);
  const activeQuoteError = quoteError?.key === requestKey ? quoteError.message : "";
  const quoteIsChecking = quoteLoading && !activeQuote && !activeQuoteError;

  const displaySubtotal = activeQuote?.subtotalMinor ?? subtotalMinor;
  const displayTotal = activeQuote?.totalMinor ?? subtotalMinor;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const mapped = key === "pickupLocationId" ? "pickupLocationId" : key;
      const addressKey = `address.${key}`;
      if (!current[mapped] && !current[addressKey]) return current;
      const next = { ...current };
      delete next[mapped];
      delete next[addressKey];
      return next;
    });
  }

  function focusFirstField(errors: FieldErrors) {
    const first = Object.keys(errors)[0];
    const id = fieldIds[first];
    if (!id) return;
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
    (element as HTMLElement | null)?.focus({ preventScroll: true });
  }

  function buildPayload() {
    return {
      idempotencyKey:
        keyRef.current || `kc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      method: form.method,
      notes: form.notes,
      pickupLocationId: form.method === "PICKUP" ? form.pickupLocationId : undefined,
      address:
        form.method === "PICKUP"
          ? undefined
          : {
              line1: form.line1,
              line2: form.line2,
              city: form.city,
              state: form.state,
              postalCode: form.postalCode,
              country: form.country,
            },
      items: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    const payload = buildPayload();
    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      const errors = fieldErrorsFromZod(parsed.error);
      setFieldErrors(errors);
      setError(firstFieldError(errors));
      focusFirstField(errors);
      return;
    }

    if (!activeQuote) {
      setError("Add a delivery address or choose pickup before placing the order.");
      return;
    }

    keyRef.current = payload.idempotencyKey;
    setFieldErrors({});
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const serverErrors = (data.fieldErrors ?? {}) as FieldErrors;
        setFieldErrors(serverErrors);
        setError(data.error ?? "We could not place the order. Check the details and try again.");
        if (Object.keys(serverErrors).length > 0) focusFirstField(serverErrors);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      clear();
      try {
        window.sessionStorage.removeItem(CHECKOUT_KEY);
      } catch {
        // Ignore storage failures after a successful order.
      }
      router.push(
        `/order-success?order=${encodeURIComponent(data.orderNumber)}&key=${encodeURIComponent(data.accessKey)}`,
      );
    } catch (submitError) {
      if (submitError instanceof TypeError) {
        setError("We could not reach the server. Check your connection and try again.");
      } else {
        setError((submitError as Error).message || "We could not place the order. Try again.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(key: string) {
    return fieldErrors[key];
  }

  function fieldA11y(id: string, key: string, hintId?: string) {
    const describedBy = [
      fieldErrors[key] ? `${id}-error` : null,
      hintId ?? null,
    ]
      .filter(Boolean)
      .join(" ");
    return {
      "aria-invalid": fieldErrors[key] ? true : undefined,
      "aria-describedby": describedBy || undefined,
    } as const;
  }

  function fieldClass(key: string) {
    return fieldErrors[key] ? "field border-[#9b1c2c]" : "field";
  }

  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="h-80 animate-pulse border border-line bg-cream" />
        <div className="h-80 animate-pulse border border-line bg-cream" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 border border-line bg-cream px-6 py-16 text-center">
        <p className="font-display text-2xl">There is nothing to check out yet.</p>
        <p className="mx-auto mt-3 max-w-[40ch] text-sm text-ink-2">
          Your bag is empty. Choose a bar and come back — nothing is charged online.
        </p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14">
      <form id="checkout-form" onSubmit={handleSubmit} className="space-y-9" noValidate>
        {error ? (
          <div role="alert" className="border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
            {error}
          </div>
        ) : null}

        <section aria-labelledby="contact-heading">
          <div className="flex items-baseline gap-3 border-b border-line pb-3">
            <span className="num text-[11px] font-semibold tracking-[0.16em] text-brass-ink">01</span>
            <h2 id="contact-heading" className="font-display text-2xl">
              Who are we writing to?
            </h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="label">Full name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={90}
                className={fieldClass("name")}
                {...fieldA11y("name", "name")}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
              <ErrorLine id="name" message={fieldError("name")} />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                readOnly={Boolean(account)}
                aria-readonly={account ? true : undefined}
                className={`${fieldClass("email")} ${account ? "bg-paper-2/60" : ""}`}
                {...fieldA11y("email", "email", "email-hint")}
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
              <ErrorLine id="email" message={fieldError("email")} />
              <p id="email-hint" className="hint">
                {account
                  ? "Locked to your account email. This is how the order appears in your history."
                  : "Used for the order confirmation and tracking."}
              </p>
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                className={fieldClass("phone")}
                {...fieldA11y("phone", "phone", "phone-hint")}
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
              <ErrorLine id="phone" message={fieldError("phone")} />
              <p id="phone-hint" className="hint">For delivery questions or pickup timing.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="fulfilment-heading">
          <div className="flex items-baseline gap-3 border-b border-line pb-3">
            <span className="num text-[11px] font-semibold tracking-[0.16em] text-brass-ink">02</span>
            <h2 id="fulfilment-heading" className="font-display text-2xl">
              How should it reach you?
            </h2>
          </div>

          <fieldset className="mt-5">
            <legend className="sr-only">Fulfilment method</legend>
            <div className="grid gap-2.5">
              {methods.map((method) => {
                const active = form.method === method.value;
                return (
                  <label
                    key={method.value}
                    className={`flex cursor-pointer items-start gap-3 border px-4 py-3.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-burgundy ${
                      active ? "border-burgundy bg-cream" : "border-line hover:border-ink-2"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fulfilment"
                      value={method.value}
                      checked={active}
                      onChange={() => {
                        update("method", method.value);
                        setQuote(null);
                        setQuoteError(null);
                      }}
                      className="mt-1 size-3.5 accent-[#75212f]"
                    />
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink">
                          {method.title}
                        </span>
                        {method.value === "PICKUP" ? (
                          <span className="text-[10px] uppercase tracking-[0.1em] text-ink-2">No fee</span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-[12.5px] leading-snug text-ink-2">
                        {method.copy}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {form.method === "PICKUP" ? (
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="pickup" className="label">Pickup location</label>
                <select
                  id="pickup"
                  name="pickup"
                  required
                  className={fieldClass("pickupLocationId")}
                  {...fieldA11y("pickup", "pickupLocationId")}
                  value={form.pickupLocationId}
                  onChange={(event) => update("pickupLocationId", event.target.value)}
                >
                  {pickups.map((pickup) => (
                    <option key={pickup.id} value={pickup.id}>
                      {pickup.name} — {pickup.city}
                    </option>
                  ))}
                </select>
                <ErrorLine id="pickup" message={fieldError("pickupLocationId")} />
              </div>

              {selectedPickup ? (
                <div className="border border-line bg-cream p-4 text-[12.5px] leading-relaxed text-ink-2">
                  <p className="font-medium text-ink">{selectedPickup.name}</p>
                  <p className="mt-1">
                    {selectedPickup.addressLine}, {selectedPickup.city} {selectedPickup.postalCode}
                  </p>
                  {selectedPickup.hours ? <p className="mt-1">Hours: {selectedPickup.hours}</p> : null}
                  <p className="mt-2 text-[11px]">{selectedPickup.instructions}</p>
                </div>
              ) : null}

              <p className="text-xs leading-relaxed text-ink-2">{pickupNote}</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="country" className="label">Country</label>
                <select
                  id="country"
                  name="country"
                  autoComplete="country"
                  required
                  className={fieldClass("address.country")}
                  {...fieldA11y("country", "address.country")}
                  value={form.country}
                  onChange={(event) => update("country", event.target.value)}
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <ErrorLine id="country" message={fieldError("address.country")} />
              </div>
              <div>
                <label htmlFor="postalCode" className="label">Postal code</label>
                <input
                  id="postalCode"
                  name="postalCode"
                  autoComplete="postal-code"
                  required
                  maxLength={16}
                  className={fieldClass("address.postalCode")}
                  {...fieldA11y("postalCode", "address.postalCode")}
                  value={form.postalCode}
                  onChange={(event) => update("postalCode", event.target.value)}
                />
                <ErrorLine id="postalCode" message={fieldError("address.postalCode")} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="line1" className="label">Address line 1</label>
                <input
                  id="line1"
                  name="line1"
                  autoComplete="address-line1"
                  required
                  minLength={3}
                  maxLength={140}
                  className={fieldClass("address.line1")}
                  {...fieldA11y("line1", "address.line1")}
                  value={form.line1}
                  onChange={(event) => update("line1", event.target.value)}
                />
                <ErrorLine id="line1" message={fieldError("address.line1")} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="line2" className="label">Address line 2 <span className="normal-case tracking-normal text-ink-2">(optional)</span></label>
                <input
                  id="line2"
                  name="line2"
                  autoComplete="address-line2"
                  maxLength={140}
                  className={fieldClass("address.line2")}
                  {...fieldA11y("line2", "address.line2")}
                  value={form.line2}
                  onChange={(event) => update("line2", event.target.value)}
                />
                <ErrorLine id="line2" message={fieldError("address.line2")} />
              </div>
              <div>
                <label htmlFor="city" className="label">City</label>
                <input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  required
                  minLength={2}
                  maxLength={80}
                  className={fieldClass("address.city")}
                  {...fieldA11y("city", "address.city")}
                  value={form.city}
                  onChange={(event) => update("city", event.target.value)}
                />
                <ErrorLine id="city" message={fieldError("address.city")} />
              </div>
              <div>
                <label htmlFor="state" className="label">State / region <span className="normal-case tracking-normal text-ink-2">(optional)</span></label>
                <input
                  id="state"
                  name="state"
                  autoComplete="address-level1"
                  maxLength={80}
                  className={fieldClass("address.state")}
                  {...fieldA11y("state", "address.state")}
                  value={form.state}
                  onChange={(event) => update("state", event.target.value)}
                />
                <ErrorLine id="state" message={fieldError("address.state")} />
              </div>

              <div className="sm:col-span-2" aria-live="polite">
                {quoteIsChecking ? (
                  <p className="flex items-center gap-2 text-xs text-ink-2">
                    <Loader2 size={13} className="animate-spin" aria-hidden /> Checking delivery…
                  </p>
                ) : activeQuoteError ? (
                  <p className="border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-xs leading-relaxed text-burgundy">
                    {activeQuoteError}
                  </p>
                ) : activeQuote ? (
                  <p className="flex items-start gap-2 border border-line bg-cream px-3 py-2 text-xs leading-relaxed text-ink-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-burgundy" aria-hidden />
                    <span>
                      <strong className="font-medium text-ink">{activeQuote.label}</strong> ·{" "}
                      {activeQuote.shippingMinor === 0
                        ? "No shipping fee"
                        : formatMoney(activeQuote.shippingMinor)}
                      <br />
                      {activeQuote.eta}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-ink-2">
                    Enter a postal code to see the delivery fee and estimate.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="notes-heading">
          <div className="flex items-baseline gap-3 border-b border-line pb-3">
            <span className="num text-[11px] font-semibold tracking-[0.16em] text-brass-ink">03</span>
            <h2 id="notes-heading" className="font-display text-2xl">
              Anything we should know?
            </h2>
          </div>
          <div className="mt-5">
            <label htmlFor="notes" className="label">Order note <span className="normal-case tracking-normal text-ink-2">(optional)</span></label>
            <textarea
              id="notes"
              name="notes"
              maxLength={500}
              className={fieldClass("notes")}
              {...fieldA11y("notes", "notes", "notes-hint")}
              placeholder="A gift note, a delivery instruction, or a question about the bars."
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
            <ErrorLine id="notes" message={fieldError("notes")} />
            <p id="notes-hint" className="hint">Do not include card or payment details. We do not collect them.</p>
          </div>
        </section>

        <div className="border border-line bg-cream p-4 text-[12px] leading-relaxed text-ink-2">
          <p className="flex items-start gap-2">
            <LockKeyhole size={15} className="mt-0.5 shrink-0 text-burgundy" aria-hidden />
            <span>
              This is an order request, not a payment. We will contact you using the details above
              to confirm stock, delivery and payment offline. No card details are requested or
              stored on this site.
            </span>
          </p>
          <p className="mt-3">
            By sending this request you agree to our{" "}
            <Link
              href="/policies#shipping"
              className="underline underline-offset-2 hover:text-burgundy"
            >
              shipping
            </Link>
            ,{" "}
            <Link
              href="/policies#returns"
              className="underline underline-offset-2 hover:text-burgundy"
            >
              returns
            </Link>{" "}
            and{" "}
            <Link
              href="/policies#privacy"
              className="underline underline-offset-2 hover:text-burgundy"
            >
              privacy
            </Link>{" "}
            policies.
          </p>
        </div>

        <div className="lg:hidden">
          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden /> Sending request…
              </>
            ) : (
              <>Send order request — {formatMoney(displayTotal)}</>
            )}
          </button>
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.12em] text-ink-2">
            No payment collected online
          </p>
        </div>
      </form>

      <aside className="h-fit border border-line bg-cream p-5 sm:p-6 lg:sticky lg:top-28">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-2">
          Order summary
        </p>

        <ul className="mt-4 divide-y divide-line/70 border-y border-line">
          {lines.map((line) => (
            <li key={line.variantId} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-[15px] font-medium leading-snug text-ink">{line.name}</p>
                <p className="mt-0.5 text-[11px] text-ink-2">
                  {line.variantName} × {line.quantity}
                </p>
              </div>
              <p className="num text-sm">{formatMoney(line.priceMinor * line.quantity)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Subtotal</dt>
            <dd className="num">{formatMoney(displaySubtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Shipping</dt>
            <dd className="num">
              {form.method === "PICKUP"
                ? "Free"
                : quoteIsChecking
                  ? "Checking…"
                  : activeQuote
                    ? formatMoney(activeQuote.shippingMinor)
                    : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">{taxLabel}</dt>
            <dd className="num">₹0</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <span className="font-display text-2xl">Total</span>
          <span className="num text-lg">{formatMoney(displayTotal)}</span>
        </div>
        <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-ink-2">
          {activeQuote ? "Includes selected shipping" : "Shipping pending"}
        </p>

        <button
          type="submit"
          form="checkout-form"
          className="btn btn-primary mt-5 w-full"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden /> Sending request…
            </>
          ) : (
            <>
              Send order request <ArrowRight size={15} aria-hidden />
            </>
          )}
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-2">
          No payment collected online. We confirm by email or phone before dispatch.
        </p>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">Read before ordering</p>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-2">
            Prices and shipping rules are placeholders until confirmed. Chocolate is perishable;
            see the shipping and returns policies.
          </p>
          <Link href="/policies" className="mt-2 inline-block text-[11px] underline underline-offset-2">
            Shipping &amp; returns
          </Link>
        </div>
      </aside>
    </div>
  );
}
