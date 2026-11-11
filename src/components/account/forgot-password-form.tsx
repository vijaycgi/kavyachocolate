"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { forgotPasswordAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton, ariaProps, fieldClass } from "@/components/account/form";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialCustomerFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner status={state.status} message={state.message} />
      <div>
        <label htmlFor="forgot-email" className="label">
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={state.values?.email ?? ""}
          className={fieldClass(Boolean(errors.email))}
          {...ariaProps("forgot-email", errors.email)}
        />
        {errors.email ? (
          <p id="forgot-email-error" className="error-text">
            {errors.email}
          </p>
        ) : null}
      </div>
      <SubmitButton pendingLabel="Requesting…">
        Send reset link <ArrowRight size={14} aria-hidden />
      </SubmitButton>
    </form>
  );
}
