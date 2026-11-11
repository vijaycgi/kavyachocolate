"use client";

import { useActionState } from "react";
import { BadgeCheck } from "lucide-react";
import { verifyEmailAction } from "@/app/(store)/account/actions";
import { initialCustomerFormState } from "@/app/(store)/account/form-state";
import { FormBanner, SubmitButton } from "@/components/account/form";

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(verifyEmailAction, initialCustomerFormState);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormBanner status={state.status} message={state.message} />
      <SubmitButton pendingLabel="Verifying…">
        <BadgeCheck size={15} aria-hidden /> Verify this email
      </SubmitButton>
    </form>
  );
}
