import type { FieldErrors } from "@/lib/validation";

/**
 * Shared shape for account form server actions. Kept outside the "use server"
 * module because that file may only export async functions.
 */
export type CustomerFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

export const initialCustomerFormState: CustomerFormState = { status: "idle" };
