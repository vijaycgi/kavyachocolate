import Link from "next/link";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/app/(store)/account/actions";
import { AddressForm } from "@/components/account/address-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { getFulfillmentOptions } from "@/lib/fulfillment";

type Search = { edit?: string; saved?: string };

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [params, customer] = await Promise.all([searchParams, requireCustomer()]);
  const [addresses, options] = await Promise.all([
    prisma.address.findMany({
      where: { customerId: customer.id, orderId: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    getFulfillmentOptions(),
  ]);

  const editing = params.edit
    ? addresses.find((address) => address.id === params.edit)
    : undefined;
  const savedMessage =
    params.saved === "deleted"
      ? "Address removed."
      : params.saved === "default"
        ? "Default address updated."
        : "";

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h2 className="font-display text-2xl">Saved addresses</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          These are used to prefill checkout. The address on an existing order is never changed
          when you edit a saved address.
        </p>
      </div>

      {savedMessage ? (
        <p role="status" className="border border-[#4f6144]/35 bg-[#4f6144]/10 px-4 py-3 text-[12.5px] text-[#3c4b33]">
          {savedMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="border border-dashed border-line bg-cream px-6 py-10 text-center">
            <p className="font-display text-xl">No saved addresses yet.</p>
            <p className="mx-auto mt-2 max-w-[42ch] text-[12px] leading-relaxed text-ink-2">
              Add one below and it will be offered as the default at checkout.
            </p>
          </div>
        ) : (
          addresses.map((address) => (
            <article key={address.id} className="border border-line bg-cream p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12.5px] font-medium text-ink">
                      {address.label || address.name}
                    </p>
                    {address.isDefault ? (
                      <span className="tag border-[#4f6144]/35 text-[#3c4b33]">
                        <Check size={10} aria-hidden /> Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                    {address.name}
                    {address.phone ? ` · ${address.phone}` : ""}
                    <br />
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}
                    {address.state ? `, ${address.state}` : ""} {address.postalCode}
                    <br />
                    {address.country}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/account/addresses?edit=${address.id}`} className="btn btn-outline btn-sm">
                    <Pencil size={12} aria-hidden /> Edit
                  </Link>
                  {!address.isDefault ? (
                    <form action={setDefaultAddressAction}>
                      <input type="hidden" name="id" value={address.id} />
                      <button type="submit" className="btn btn-outline btn-sm">Make default</button>
                    </form>
                  ) : null}
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={address.id} />
                    <ConfirmSubmit
                      className="btn btn-outline btn-sm border-burgundy/40 text-burgundy"
                      message="Remove this saved address? Existing orders are not affected."
                    >
                      <Trash2 size={12} aria-hidden /> Remove
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <section className="border border-line bg-cream p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
          <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-2">
            <Plus size={13} aria-hidden /> {editing ? "Edit address" : "Add an address"}
          </h3>
          {editing ? (
            <Link href="/account/addresses" className="text-[10px] uppercase tracking-[0.12em] text-ink-2 hover:text-burgundy">
              Cancel edit
            </Link>
          ) : null}
        </div>
        <div className="mt-4">
          <AddressForm
            key={editing?.id ?? "new"}
            address={editing}
            countries={options.countries}
            onDoneHref="/account/addresses"
          />
        </div>
      </section>
    </div>
  );
}
