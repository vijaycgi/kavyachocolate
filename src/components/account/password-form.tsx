"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { changePasswordAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton, ariaProps, fieldClass } from "@/components/account/form";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction] = useActionState(changePasswordAction, initialCustomerFormState);
  const router = useRouter();
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner status={state.status} message={state.message} />

      {hasPassword ? (
        <div>
          <label htmlFor="current-password" className="label">
            Current password
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={fieldClass(Boolean(errors.currentPassword))}
            {...ariaProps("current-password", errors.currentPassword)}
          />
          {errors.currentPassword ? (
            <p id="current-password-error" className="error-text">{errors.currentPassword}</p>
          ) : null}
        </div>
      ) : (
        <p className="border border-line bg-paper-2/60 px-3 py-2.5 text-[12px] leading-relaxed text-ink-2">
          This account signs in with Google. Set a password to keep an email sign-in option as well.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className="label">
            {hasPassword ? "New password" : "Password"}
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={72}
            className={fieldClass(Boolean(errors.password))}
            {...ariaProps("new-password", errors.password)}
          />
          {errors.password ? (
            <p id="new-password-error" className="error-text">{errors.password}</p>
          ) : (
            <p className="hint">At least {PASSWORD_MIN_LENGTH} characters, with a letter and a number.</p>
          )}
        </div>
        <div>
          <label htmlFor="confirm-password" className="label">
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={72}
            className={fieldClass(Boolean(errors.confirmPassword))}
            {...ariaProps("confirm-password", errors.confirmPassword)}
          />
          {errors.confirmPassword ? (
            <p id="confirm-password-error" className="error-text">{errors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <SubmitButton className="btn btn-primary" pendingLabel="Saving…">
        <KeyRound size={14} aria-hidden /> {hasPassword ? "Change password" : "Set password"}
      </SubmitButton>
      <p className="text-[11px] leading-relaxed text-ink-2">
        Saving rotates every active session and signs this browser back in.
      </p>
    </form>
  );
}
