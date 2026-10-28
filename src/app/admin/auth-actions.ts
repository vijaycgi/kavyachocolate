"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession } from "@/lib/auth";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) return "/admin";
  return value;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    redirect(`/admin/login?error=missing&next=${encodeURIComponent(safeNext(next))}`);
  }

  const admin = await authenticate(email, password);
  if (!admin) {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(safeNext(next))}`);
  }

  await createSession(admin.id);
  redirect(safeNext(next));
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login?loggedout=1");
}
