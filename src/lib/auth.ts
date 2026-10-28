import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const SESSION_COOKIE = "kavya_admin_session";
const SESSION_DAYS = 7;

// A Secure cookie is dropped by the browser on plain http, which would make
// sign-in fail silently on localhost, a LAN address, or any http-only staging
// host. Decide from the request instead of assuming production means https.
async function cookieIsSecure() {
  if (process.env.NODE_ENV !== "production") return false;

  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";

  const host = (requestHeaders.get("host") ?? "").split(":")[0].trim().toLowerCase();
  const isLocalHost =
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

  return !isLocalHost;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.admin;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login?reason=session");
  return admin;
}

export async function createSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), adminId, expiresAt },
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieIsSecure(),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
}

export async function authenticate(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!admin) {
    // Keep the timing roughly comparable to a real comparison.
    await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
    return null;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  await prisma.session.deleteMany({
    where: { adminId: admin.id, expiresAt: { lt: new Date() } },
  });

  return admin;
}
