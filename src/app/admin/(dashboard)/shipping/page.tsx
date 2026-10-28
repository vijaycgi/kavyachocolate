import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import {
  saveAreaAction,
  savePickupAction,
  saveZoneAction,
} from "@/app/admin/(dashboard)/actions";
import { Flash, PageHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatMoney, minorToRupees } from "@/lib/money";

export const metadata = { title: "Shipping" };

type Search = { saved?: string; error?: string };

export default async function AdminShippingPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const [zones, pickups, areas] = await Promise.all([
    prisma.shippingZone.findMany({ orderBy: { position: "asc" } }),
    prisma.pickupLocation.findMany({ orderBy: { position: "asc" } }),
    prisma.deliveryArea.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fulfilment"
        title="Where the chocolate can go."
        description="Courier zones, local delivery by postal code, and pickup locations. Checkout prices every order against these live rules on the server."
        actions={
          <Link href="/policies" target="_blank" className="btn btn-outline btn-sm">
            View customer policy <ExternalLink size={12} aria-hidden />
          </Link>
        }
      />

      <Flash saved={params.saved} error={params.error} />

      <section className="space-y-3">
        <div className="flex items-end justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-display text-2xl">Courier zones</h2>
            <p className="mt-1 text-[12px] text-ink-2">
              Countries are two-letter ISO codes. A country not in any active zone cannot be
              shipped to.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.12em] text-ink-2">{zones.length} zones</span>
        </div>

        {zones.map((zone) => (
          <details key={zone.id} className="group border border-line bg-cream">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-medium">{zone.name}</p>
                <p className="mt-0.5 text-[10.5px] text-ink-2">
                  {zone.countries} · {formatMoney(zone.feeMinor)} · free over{" "}
                  {zone.freeOverMinor > 0 ? formatMoney(zone.freeOverMinor) : "—"}
                </p>
              </div>
              <span className={`tag ${zone.active ? "border-[#4f6144]/30 text-[#3c4b33]" : ""}`}>
                {zone.active ? "Active" : "Inactive"} · Edit
              </span>
            </summary>
            <div className="border-t border-line p-4">
              <ZoneForm
                id={zone.id}
                defaults={{
                  name: zone.name,
                  countries: zone.countries,
                  feeMinor: zone.feeMinor,
                  freeOverMinor: zone.freeOverMinor,
                  minDays: zone.minDays,
                  maxDays: zone.maxDays,
                  active: zone.active,
                  position: zone.position,
                }}
              />
            </div>
          </details>
        ))}

        <details className="border border-dashed border-line bg-paper-2">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-burgundy [&::-webkit-details-marker]:hidden">
            <Plus size={13} aria-hidden /> Add a shipping zone
          </summary>
          <div className="border-t border-line p-4">
            <ZoneForm />
          </div>
        </details>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-display text-2xl">Local delivery</h2>
            <p className="mt-1 text-[12px] text-ink-2">
              Enter postal prefixes ending in * (for example 560*) or exact codes, separated by
              commas.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.12em] text-ink-2">{areas.length} areas</span>
        </div>

        {areas.map((area) => (
          <details key={area.id} className="group border border-line bg-cream">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-medium">{area.name}</p>
                <p className="mt-0.5 text-[10.5px] text-ink-2">
                  {area.postalCodes} · {formatMoney(area.feeMinor)} · min {formatMoney(area.minOrderMinor)}
                </p>
              </div>
              <span className={`tag ${area.active ? "border-[#4f6144]/30 text-[#3c4b33]" : ""}`}>
                {area.active ? "Active" : "Inactive"} · Edit
              </span>
            </summary>
            <div className="border-t border-line p-4">
              <AreaForm
                id={area.id}
                defaults={{
                  name: area.name,
                  postalCodes: area.postalCodes,
                  feeMinor: area.feeMinor,
                  minOrderMinor: area.minOrderMinor,
                  schedule: area.schedule,
                  active: area.active,
                  position: area.position,
                }}
              />
            </div>
          </details>
        ))}

        <details className="border border-dashed border-line bg-paper-2">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-burgundy [&::-webkit-details-marker]:hidden">
            <Plus size={13} aria-hidden /> Add a local delivery area
          </summary>
          <div className="border-t border-line p-4">
            <AreaForm />
          </div>
        </details>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-display text-2xl">Pickup locations</h2>
            <p className="mt-1 text-[12px] text-ink-2">
              Pickup is always free. Instructions are shown to the customer at checkout and on the
              receipt.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.12em] text-ink-2">{pickups.length} locations</span>
        </div>

        {pickups.map((pickup) => (
          <details key={pickup.id} className="group border border-line bg-cream">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="font-medium">{pickup.name}</p>
                <p className="mt-0.5 text-[10.5px] text-ink-2">
                  {pickup.addressLine}, {pickup.city} {pickup.postalCode} · {pickup.hours}
                </p>
              </div>
              <span className={`tag ${pickup.active ? "border-[#4f6144]/30 text-[#3c4b33]" : ""}`}>
                {pickup.active ? "Active" : "Inactive"} · Edit
              </span>
            </summary>
            <div className="border-t border-line p-4">
              <PickupForm
                id={pickup.id}
                defaults={{
                  name: pickup.name,
                  addressLine: pickup.addressLine,
                  city: pickup.city,
                  postalCode: pickup.postalCode,
                  phone: pickup.phone ?? "",
                  instructions: pickup.instructions,
                  hours: pickup.hours,
                  active: pickup.active,
                  position: pickup.position,
                }}
              />
            </div>
          </details>
        ))}

        <details className="border border-dashed border-line bg-paper-2">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-burgundy [&::-webkit-details-marker]:hidden">
            <Plus size={13} aria-hidden /> Add a pickup location
          </summary>
          <div className="border-t border-line p-4">
            <PickupForm />
          </div>
        </details>
      </section>

      <p className="border-t border-line pt-4 text-[10.5px] leading-relaxed text-ink-2">
        Seed rates and pickup details are placeholders. The free-shipping threshold for local
        delivery is controlled in <Link href="/admin/settings" className="underline">Settings</Link>.
        Tax is not configured and remains at zero until the owner sets a verified rate.
      </p>
    </div>
  );
}

type ZoneDefaults = {
  name: string;
  countries: string;
  feeMinor: number;
  freeOverMinor: number;
  minDays: number | null;
  maxDays: number | null;
  active: boolean;
  position: number;
};

function ZoneForm({ id, defaults }: { id?: string; defaults?: ZoneDefaults }) {
  return (
    <form action={saveZoneAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <div className="sm:col-span-2">
        <label className="label">Zone name</label>
        <input name="name" required defaultValue={defaults?.name ?? ""} className="field min-h-10 text-[12px]" placeholder="India" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Country codes</label>
        <input name="countries" defaultValue={defaults?.countries ?? "[]"} className="field min-h-10 font-mono text-[11px]" placeholder='["IN"]' />
        <p className="hint">JSON array, e.g. [&quot;IN&quot;] or [&quot;US&quot;,&quot;GB&quot;].</p>
      </div>
      <div>
        <label className="label">Fee (₹)</label>
        <input name="fee" type="number" min={0} step="0.01" defaultValue={defaults ? minorToRupees(defaults.feeMinor) : "80"} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">Free over (₹)</label>
        <input name="freeOver" type="number" min={0} step="0.01" defaultValue={defaults ? minorToRupees(defaults.freeOverMinor) : "1500"} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">Min days</label>
        <input name="minDays" type="number" min={0} defaultValue={defaults?.minDays ?? ""} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">Max days</label>
        <input name="maxDays" type="number" min={0} defaultValue={defaults?.maxDays ?? ""} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">Position</label>
        <input name="position" type="number" min={0} defaultValue={defaults?.position ?? 0} className="field min-h-10 text-[12px]" />
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-[11.5px]">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} className="size-3.5 accent-[#75212f]" />
        Active
      </label>
      <div className="flex items-end sm:col-span-2">
        <button type="submit" className="btn btn-primary btn-sm">Save zone</button>
      </div>
    </form>
  );
}

type AreaDefaults = {
  name: string;
  postalCodes: string;
  feeMinor: number;
  minOrderMinor: number;
  schedule: string;
  active: boolean;
  position: number;
};

function AreaForm({ id, defaults }: { id?: string; defaults?: AreaDefaults }) {
  return (
    <form action={saveAreaAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <div>
        <label className="label">Area name</label>
        <input name="name" required defaultValue={defaults?.name ?? ""} className="field min-h-10 text-[12px]" placeholder="Bengaluru city" />
      </div>
      <div>
        <label className="label">Postal patterns</label>
        <input name="postalCodes" defaultValue={defaults?.postalCodes ?? "[]"} className="field min-h-10 font-mono text-[11px]" placeholder='["560*"]' />
        <p className="hint">JSON array; * is a prefix match.</p>
      </div>
      <div>
        <label className="label">Fee (₹)</label>
        <input name="fee" type="number" min={0} step="0.01" defaultValue={defaults ? minorToRupees(defaults.feeMinor) : "60"} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">Minimum order (₹)</label>
        <input name="minOrder" type="number" min={0} step="0.01" defaultValue={defaults ? minorToRupees(defaults.minOrderMinor) : "0"} className="field min-h-10 text-[12px]" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Schedule</label>
        <input name="schedule" defaultValue={defaults?.schedule ?? ""} className="field min-h-10 text-[12px]" placeholder="Tuesday to Saturday, 10:00–18:00" />
      </div>
      <div>
        <label className="label">Position</label>
        <input name="position" type="number" min={0} defaultValue={defaults?.position ?? 0} className="field min-h-10 text-[12px]" />
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-[11.5px]">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} className="size-3.5 accent-[#75212f]" />
        Active
      </label>
      <div className="flex items-end sm:col-span-2">
        <button type="submit" className="btn btn-primary btn-sm">Save area</button>
      </div>
    </form>
  );
}

type PickupDefaults = {
  name: string;
  addressLine: string;
  city: string;
  postalCode: string;
  phone: string;
  instructions: string;
  hours: string;
  active: boolean;
  position: number;
};

function PickupForm({ id, defaults }: { id?: string; defaults?: PickupDefaults }) {
  return (
    <form action={savePickupAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <div className="sm:col-span-2">
        <label className="label">Location name</label>
        <input name="name" required defaultValue={defaults?.name ?? ""} className="field min-h-10 text-[12px]" placeholder="Kavya Chocolat Studio" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Address</label>
        <input name="addressLine" defaultValue={defaults?.addressLine ?? ""} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">City</label>
        <input name="city" defaultValue={defaults?.city ?? ""} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">Postal code</label>
        <input name="postalCode" defaultValue={defaults?.postalCode ?? ""} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">Phone</label>
        <input name="phone" defaultValue={defaults?.phone ?? ""} className="field min-h-10 text-[12px]" />
      </div>
      <div>
        <label className="label">Hours</label>
        <input name="hours" defaultValue={defaults?.hours ?? ""} className="field min-h-10 text-[12px]" placeholder="Tue–Sat, 10:00–18:00" />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="label">Pickup instructions</label>
        <textarea name="instructions" defaultValue={defaults?.instructions ?? ""} rows={2} className="field text-[12px]" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="label">Position</label>
        <input name="position" type="number" min={0} defaultValue={defaults?.position ?? 0} className="field min-h-10 text-[12px]" />
      </div>
      <label className="flex items-center gap-2 text-[11.5px]">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} className="size-3.5 accent-[#75212f]" />
        Active
      </label>
      <div className="flex items-end">
        <button type="submit" className="btn btn-primary btn-sm">Save location</button>
      </div>
    </form>
  );
}
