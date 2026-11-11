"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession } from "@/lib/auth";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { safeAdminNext } from "@/lib/redirects";
import { adminLoginSchema } from "@/lib/validation";

export async function loginAction(formData: FormData) {
  const next = safeAdminNext(String(formData.get("next") ?? ""));
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });

  if (!parsed.success) {
    redirect(`/admin/login?error=missing&next=${encodeURIComponent(next)}`);
  }

  const { email, password } = parsed.data;
  const limited = await checkRateLimit("adminLogin", email);
  if (!limited.ok) {
    redirect(
      `/admin/login?error=limited&retry=${limited.retryAfterSeconds}&next=${encodeURIComponent(next)}`,
    );
  }

  const admin = await authenticate(email, password);
  if (!admin) {
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(next)}`);
  }

  await clearRateLimit("adminLogin", email);
  await createSession(admin.id);
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login?loggedout=1");
}
