"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { saveAddressAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton, ariaProps, fieldClass } from "@/components/account/form";

type AddressFields = {
  id?: string;
  label?: string | null;
  name: string;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export function AddressForm({
  address,
  countries,
  onDoneHref = "/account/addresses",
}: {
  address?: AddressFields;
  countries: { code: string; name: string }[];
  onDoneHref?: string;
}) {
  const [state, formAction] = useActionState(saveAddressAction, initialCustomerFormState);
  const router = useRouter();
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const value = (key: keyof AddressFields) =>
    values[key] ?? String(address?.[key] ?? "");

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      if (onDoneHref) router.replace(onDoneHref);
    }
  }, [state.status, router, onDoneHref]);

  return (
    <form action={formAction} className="space-y-4">
      {address?.id ? <input type="hidden" name="id" value={address.id} /> : null}
      <FormBanner status={state.status} message={state.message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="address-label" className="label">
            Label <span className="normal-case tracking-normal text-ink-2">(optional)</span>
          </label>
          <input
            id="address-label"
            name="label"
            maxLength={40}
            defaultValue={value("label")}
            placeholder="Home, studio, gift address"
            className={fieldClass(Boolean(errors.label))}
            {...ariaProps("address-label", errors.label)}
          />
          {errors.label ? <p id="address-label-error" className="error-text">{errors.label}</p> : null}
        </div>
        <div>
          <label htmlFor="address-name" className="label">
            Recipient name
          </label>
          <input
            id="address-name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={90}
            defaultValue={value("name")}
            className={fieldClass(Boolean(errors.name))}
            {...ariaProps("address-name", errors.name)}
          />
          {errors.name ? <p id="address-name-error" className="error-text">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="address-phone" className="label">
            Phone
          </label>
          <input
            id="address-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={24}
            defaultValue={value("phone")}
            className={fieldClass(Boolean(errors.phone))}
            {...ariaProps("address-phone", errors.phone)}
          />
          {errors.phone ? <p id="address-phone-error" className="error-text">{errors.phone}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address-line1" className="label">
            Address line 1
          </label>
          <input
            id="address-line1"
            name="line1"
            autoComplete="address-line1"
            required
            minLength={3}
            maxLength={140}
            defaultValue={value("line1")}
            className={fieldClass(Boolean(errors.line1))}
            {...ariaProps("address-line1", errors.line1)}
          />
          {errors.line1 ? <p id="address-line1-error" className="error-text">{errors.line1}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address-line2" className="label">
            Address line 2 <span className="normal-case tracking-normal text-ink-2">(optional)</span>
          </label>
          <input
            id="address-line2"
            name="line2"
            autoComplete="address-line2"
            maxLength={140}
            defaultValue={value("line2")}
            className={fieldClass(Boolean(errors.line2))}
            {...ariaProps("address-line2", errors.line2)}
          />
          {errors.line2 ? <p id="address-line2-error" className="error-text">{errors.line2}</p> : null}
        </div>
        <div>
          <label htmlFor="address-city" className="label">
            City
          </label>
          <input
            id="address-city"
            name="city"
            autoComplete="address-level2"
            required
            minLength={2}
            maxLength={80}
            defaultValue={value("city")}
            className={fieldClass(Boolean(errors.city))}
            {...ariaProps("address-city", errors.city)}
          />
          {errors.city ? <p id="address-city-error" className="error-text">{errors.city}</p> : null}
        </div>
        <div>
          <label htmlFor="address-state" className="label">
            State / region <span className="normal-case tracking-normal text-ink-2">(optional)</span>
          </label>
          <input
            id="address-state"
            name="state"
            autoComplete="address-level1"
            maxLength={80}
            defaultValue={value("state")}
            className={fieldClass(Boolean(errors.state))}
            {...ariaProps("address-state", errors.state)}
          />
          {errors.state ? <p id="address-state-error" className="error-text">{errors.state}</p> : null}
        </div>
        <div>
          <label htmlFor="address-postal" className="label">
            Postal code
          </label>
          <input
            id="address-postal"
            name="postalCode"
            autoComplete="postal-code"
            required
            minLength={3}
            maxLength={16}
            defaultValue={value("postalCode")}
            className={fieldClass(Boolean(errors.postalCode))}
            {...ariaProps("address-postal", errors.postalCode)}
          />
          {errors.postalCode ? <p id="address-postal-error" className="error-text">{errors.postalCode}</p> : null}
        </div>
        <div>
          <label htmlFor="address-country" className="label">
            Country
          </label>
          <select
            id="address-country"
            name="country"
            autoComplete="country"
            required
            defaultValue={value("country") || "IN"}
            className={fieldClass(Boolean(errors.country))}
            {...ariaProps("address-country", errors.country)}
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country ? <p id="address-country-error" className="error-text">{errors.country}</p> : null}
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-ink-2">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
          className="mt-0.5 size-4 shrink-0 accent-[#75212f]"
        />
        Use this as the default delivery address at checkout.
      </label>

      <SubmitButton className="btn btn-primary" pendingLabel="Saving address…">
        <MapPin size={14} aria-hidden /> {address?.id ? "Save address" : "Add address"}
      </SubmitButton>
    </form>
  );
}
