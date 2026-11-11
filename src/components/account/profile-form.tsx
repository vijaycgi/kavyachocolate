"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateProfileAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton, ariaProps, fieldClass } from "@/components/account/form";

export function ProfileForm({
  name,
  phone,
  email,
}: {
  name: string;
  phone: string;
  email: string;
}) {
  const [state, formAction] = useActionState(updateProfileAction, initialCustomerFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner status={state.status} message={state.message} />

      <div>
        <label htmlFor="profile-name" className="label">
          Full name
        </label>
        <input
          id="profile-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={90}
          defaultValue={state.values?.name ?? name}
          className={fieldClass(Boolean(errors.name))}
          {...ariaProps("profile-name", errors.name)}
        />
        {errors.name ? (
          <p id="profile-name-error" className="error-text">{errors.name}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="profile-email" className="label">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          readOnly
          disabled
          className="field bg-paper-2/60"
          aria-describedby="profile-email-hint"
        />
        <p id="profile-email-hint" className="hint">
          The email is the account identity and cannot be edited here. Contact the studio if it
          needs to change.
        </p>
      </div>

      <div>
        <label htmlFor="profile-phone" className="label">
          Phone <span className="normal-case tracking-normal text-ink-2">(optional)</span>
        </label>
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={24}
          defaultValue={state.values?.phone ?? phone}
          className={fieldClass(Boolean(errors.phone))}
          {...ariaProps("profile-phone", errors.phone)}
        />
        {errors.phone ? (
          <p id="profile-phone-error" className="error-text">{errors.phone}</p>
        ) : (
          <p className="hint">Used for delivery questions if you place an order.</p>
        )}
      </div>

      <SubmitButton className="btn btn-primary" pendingLabel="Saving…">
        <Save size={14} aria-hidden /> Save profile
      </SubmitButton>
    </form>
  );
}
