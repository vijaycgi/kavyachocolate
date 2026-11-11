"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { resetPasswordAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton, ariaProps, fieldClass } from "@/components/account/form";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialCustomerFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormBanner status={state.status} message={state.message} />

      <div>
        <label htmlFor="reset-password" className="label">
          New password
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={72}
          autoFocus
          className={fieldClass(Boolean(errors.password))}
          {...ariaProps("reset-password", errors.password)}
        />
        {errors.password ? (
          <p id="reset-password-error" className="error-text">
            {errors.password}
          </p>
        ) : (
          <p className="hint">At least {PASSWORD_MIN_LENGTH} characters, with a letter and a number.</p>
        )}
      </div>

      <div>
        <label htmlFor="reset-confirm" className="label">
          Confirm new password
        </label>
        <input
          id="reset-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={72}
          className={fieldClass(Boolean(errors.confirmPassword))}
          {...ariaProps("reset-confirm", errors.confirmPassword)}
        />
        {errors.confirmPassword ? (
          <p id="reset-confirm-error" className="error-text">
            {errors.confirmPassword}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Saving password…">
        Set new password <ArrowRight size={14} aria-hidden />
      </SubmitButton>
    </form>
  );
}
