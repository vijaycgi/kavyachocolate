"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { customerRegisterAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton, ariaProps, fieldClass } from "@/components/account/form";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";

export function RegisterForm() {
  const [state, formAction] = useActionState(customerRegisterAction, initialCustomerFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <FormBanner status={state.status} message={state.message} />

      <div>
        <label htmlFor="register-name" className="label">
          Full name
        </label>
        <input
          id="register-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={90}
          autoFocus
          defaultValue={state.values?.name ?? ""}
          className={fieldClass(Boolean(errors.name))}
          {...ariaProps("register-name", errors.name)}
        />
        {errors.name ? (
          <p id="register-name-error" className="error-text">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="register-email" className="label">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={state.values?.email ?? ""}
          className={fieldClass(Boolean(errors.email))}
          {...ariaProps("register-email", errors.email)}
        />
        {errors.email ? (
          <p id="register-email-error" className="error-text">
            {errors.email}
          </p>
        ) : (
          <p className="hint">Order updates and the verification link go here.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="register-password" className="label">
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={72}
            className={fieldClass(Boolean(errors.password))}
            {...ariaProps("register-password", errors.password)}
          />
          {errors.password ? (
            <p id="register-password-error" className="error-text">
              {errors.password}
            </p>
          ) : (
            <p className="hint">At least {PASSWORD_MIN_LENGTH} characters, with a letter and a number.</p>
          )}
        </div>
        <div>
          <label htmlFor="register-confirm" className="label">
            Confirm password
          </label>
          <input
            id="register-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={72}
            className={fieldClass(Boolean(errors.confirmPassword))}
            {...ariaProps("register-confirm", errors.confirmPassword)}
          />
          {errors.confirmPassword ? (
            <p id="register-confirm-error" className="error-text">
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-ink-2">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            className="mt-0.5 size-4 shrink-0 accent-[#75212f]"
            aria-describedby={errors.acceptTerms ? "register-terms-error" : undefined}
          />
          <span>
            I agree to the{" "}
            <Link href="/policies" className="text-ink underline underline-offset-2 hover:text-burgundy">
              store policies
            </Link>
            , including the privacy and returns policy.
          </span>
        </label>
        {errors.acceptTerms ? (
          <p id="register-terms-error" className="error-text">
            {errors.acceptTerms}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Creating account…">
        Create account <ArrowRight size={14} aria-hidden />
      </SubmitButton>
    </form>
  );
}
