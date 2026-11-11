"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { customerLoginAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton, ariaProps, fieldClass } from "@/components/account/form";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(customerLoginAction, initialCustomerFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormBanner status={state.status} message={state.message} />

      <div>
        <label htmlFor="login-email" className="label">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={state.values?.email ?? ""}
          className={fieldClass(Boolean(errors.email))}
          {...ariaProps("login-email", errors.email)}
        />
        {errors.email ? (
          <p id="login-email-error" className="error-text">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="login-password" className="label">
            Password
          </label>
          <Link
            href="/account/forgot-password"
            className="mb-1 text-[11px] text-ink-2 underline underline-offset-2 hover:text-burgundy"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass(Boolean(errors.password))}
          {...ariaProps("login-password", errors.password)}
        />
        {errors.password ? (
          <p id="login-password-error" className="error-text">
            {errors.password}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Signing in…">
        Sign in <ArrowRight size={14} aria-hidden />
      </SubmitButton>
    </form>
  );
}
