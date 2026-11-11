"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { resendVerificationAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton } from "@/components/account/form";

export function ResendVerificationForm() {
  const [state, formAction] = useActionState(resendVerificationAction, initialCustomerFormState);
  return (
    <form action={formAction} className="space-y-3">
      <FormBanner status={state.status} message={state.message} />
      <SubmitButton className="btn btn-outline btn-sm" pendingLabel="Sending…">
        <Mail size={13} aria-hidden /> Resend verification email
      </SubmitButton>
    </form>
  );
}
