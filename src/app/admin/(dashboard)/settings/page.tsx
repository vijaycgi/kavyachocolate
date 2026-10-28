import Link from "next/link";
import { KeyRound, Save } from "lucide-react";
import {
  changePasswordAction,
  saveSettingsAction,
} from "@/app/admin/(dashboard)/actions";
import { Flash, PageHeader, SectionHeading } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { minorToRupees } from "@/lib/money";
import { getSettings, settingNumber } from "@/lib/settings";

export const metadata = { title: "Settings" };

type Search = { saved?: string; error?: string };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [params, admin, settings] = await Promise.all([
    searchParams,
    requireAdmin(),
    getSettings(),
  ]);

  const taxRateBp = settingNumber(settings, "store.taxRateBp", 0);
  const taxPercent = taxRateBp / 100;
  const emailConfigured = settings["store.emailStatus"] === "configured";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="The store, in your words."
        description="These values appear on the storefront, the checkout and every order receipt. Nothing here is guessed for you — replace the placeholders before launch."
        actions={
          <Link href="/" target="_blank" className="btn btn-outline btn-sm">
            View storefront
          </Link>
        }
      />

      <Flash saved={params.saved} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <form action={saveSettingsAction} className="space-y-6">
          <section className="border border-line bg-cream p-4 sm:p-5">
            <SectionHeading
              title="Store details"
              description="Shown in the footer, on policies and on receipts."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="store.name" className="label">
                  Store name
                </label>
                <input
                  id="store.name"
                  name="store.name"
                  defaultValue={settings["store.name"]}
                  className="field"
                  required
                />
              </div>
              <div>
                <label htmlFor="store.tagline" className="label">
                  Tagline
                </label>
                <input
                  id="store.tagline"
                  name="store.tagline"
                  defaultValue={settings["store.tagline"]}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="store.email" className="label">
                  Contact email
                </label>
                <input
                  id="store.email"
                  name="store.email"
                  type="email"
                  defaultValue={settings["store.email"]}
                  className="field"
                  required
                />
                <p className="hint">
                  Customers write here. Automated email is{" "}
                  {emailConfigured ? "configured" : "not configured"} in this build.
                </p>
              </div>
              <div>
                <label htmlFor="store.phone" className="label">
                  Phone
                </label>
                <input
                  id="store.phone"
                  name="store.phone"
                  type="tel"
                  defaultValue={settings["store.phone"]}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="store.address" className="label">
                  Studio / business address
                </label>
                <input
                  id="store.address"
                  name="store.address"
                  defaultValue={settings["store.address"]}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="store.instagram" className="label">
                  Instagram URL
                </label>
                <input
                  id="store.instagram"
                  name="store.instagram"
                  type="url"
                  defaultValue={settings["store.instagram"]}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="store.announcement" className="label">
                  Announcement bar
                </label>
                <input
                  id="store.announcement"
                  name="store.announcement"
                  defaultValue={settings["store.announcement"]}
                  maxLength={120}
                  className="field"
                />
                <p className="hint">Keep it short; it is a single line on mobile.</p>
              </div>
            </div>
          </section>

          <section className="border border-line bg-cream p-4 sm:p-5">
            <SectionHeading
              title="Operations"
              description="Money values are in INR. Free shipping applies to courier and local delivery."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="store.freeShippingOver" className="label">
                  Free shipping over (₹)
                </label>
                <input
                  id="store.freeShippingOver"
                  name="store.freeShippingOver"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={minorToRupees(
                    settingNumber(settings, "store.freeShippingOver", 150000),
                  )}
                  className="field"
                />
                <p className="hint">Set to 0 to never advertise free shipping.</p>
              </div>
              <div>
                <label htmlFor="store.taxPercent" className="label">
                  Tax rate (%)
                </label>
                <input
                  id="store.taxPercent"
                  name="store.taxPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={taxPercent}
                  className="field"
                />
                <p className="hint">
                  Leave at 0 until a verified rate applies. Tax is currently not added to order
                  totals.
                </p>
              </div>
              <div>
                <label htmlFor="store.taxLabel" className="label">
                  Tax label on receipts
                </label>
                <input
                  id="store.taxLabel"
                  name="store.taxLabel"
                  defaultValue={settings["store.taxLabel"]}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="store.lowStockThreshold" className="label">
                  Low stock at
                </label>
                <input
                  id="store.lowStockThreshold"
                  name="store.lowStockThreshold"
                  type="number"
                  min={0}
                  defaultValue={settings["store.lowStockThreshold"]}
                  className="field"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="store.pickupNote" className="label">
                  Pickup note
                </label>
                <textarea
                  id="store.pickupNote"
                  name="store.pickupNote"
                  rows={3}
                  defaultValue={settings["store.pickupNote"]}
                  className="field"
                />
                <p className="hint">Shown at checkout and on the policies page.</p>
              </div>
            </div>
          </section>

          <section className="border border-line bg-cream p-4 sm:p-5">
            <SectionHeading
              title="Policies"
              description="Plain text. Placeholders must be reviewed by the owner before launch."
            />
            <div className="mt-4 space-y-4">
              {[
                ["policy.shipping", "Shipping policy"],
                ["policy.returns", "Returns & damage policy"],
                ["policy.privacy", "Privacy policy"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label htmlFor={key} className="label">
                    {label}
                  </label>
                  <textarea
                    id={key}
                    name={key}
                    rows={4}
                    defaultValue={settings[key]}
                    className="field"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 border border-line bg-paper/95 px-4 py-3 backdrop-blur-md">
            <p className="text-[11px] leading-relaxed text-ink-2">
              Saving updates the storefront on the next request.
            </p>
            <button type="submit" className="btn btn-primary btn-sm">
              <Save size={13} aria-hidden /> Save settings
            </button>
          </div>
        </form>

        <div className="space-y-5">
          <section className="border border-line bg-cream p-4 sm:p-5">
            <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
              <KeyRound size={13} aria-hidden /> Admin password
            </h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">
              Signed in as <strong className="font-medium text-ink">{admin.email}</strong>. Changing
              the password signs out every other session.
            </p>
            <form action={changePasswordAction} className="mt-4 space-y-3">
              <div>
                <label htmlFor="currentPassword" className="label">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="field min-h-10 text-[12px]"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="label">
                  New password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  required
                  className="field min-h-10 text-[12px]"
                />
                <p className="hint">At least 10 characters.</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  required
                  className="field min-h-10 text-[12px]"
                />
              </div>
              <button type="submit" className="btn btn-outline btn-sm w-full">
                Change password
              </button>
            </form>
          </section>

          <section className="border border-line bg-paper-2 p-4 text-[11px] leading-relaxed text-ink-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink">
              Configuration status
            </p>
            <dl className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <dt>Online payment</dt>
                <dd className="font-semibold text-ink">Not enabled by design</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Automated email</dt>
                <dd className="font-semibold text-ink">
                  {emailConfigured ? "Configured" : "Not configured"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Tax</dt>
                <dd className="num font-semibold text-ink">
                  {taxRateBp === 0 ? "0% · not configured" : `${taxPercent}%`}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Currency</dt>
                <dd className="font-semibold text-ink">INR</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-line pt-3">
              Orders are requests. Fulfilment statuses track the work; no money moves through this
              site.
            </p>
          </section>

          <section className="border border-line p-4 text-[11px] leading-relaxed text-ink-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink">
              Before launch
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Replace placeholder email, phone and address.</li>
              <li>Review all three policies with local requirements.</li>
              <li>Confirm prices, weights and photography.</li>
              <li>Set tax only with a verified rate.</li>
              <li>Change the seeded password and set a strong secret.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
