"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";

export function SubmitButton({
  children,
  pendingLabel = "Working…",
  className = "btn btn-primary w-full",
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" aria-hidden /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="error-text">
      {message}
    </p>
  );
}

export function FormBanner({
  status,
  message,
}: {
  status: "idle" | "error" | "success";
  message?: string;
}) {
  if (status === "idle" || !message) return null;
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      className={`flex items-start gap-2.5 border px-3.5 py-3 text-[12.5px] leading-relaxed ${
        status === "error"
          ? "border-burgundy/35 bg-burgundy/5 text-burgundy"
          : "border-[#4f6144]/35 bg-[#4f6144]/10 text-[#3c4b33]"
      }`}
    >
      {status === "error" ? (
        <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <Check size={15} className="mt-0.5 shrink-0" aria-hidden />
      )}
      <span>{message}</span>
    </div>
  );
}

export function fieldClass(invalid?: boolean) {
  return invalid ? "field border-[#9b1c2c]" : "field";
}

export function ariaProps(id: string, message?: string) {
  return {
    "aria-invalid": message ? true : undefined,
    "aria-describedby": message ? `${id}-error` : undefined,
  } as const;
}
