import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./db";

type Limit = { limit: number; windowSeconds: number };

export const authLimits = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  register: { limit: 6, windowSeconds: 60 * 60 },
  forgotPassword: { limit: 5, windowSeconds: 60 * 60 },
  resetPassword: { limit: 10, windowSeconds: 60 * 60 },
  adminLogin: { limit: 8, windowSeconds: 15 * 60 },
} satisfies Record<string, Limit>;

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export async function requestIp() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = requestHeaders.get("x-real-ip")?.trim();
  return forwarded || real || "unknown";
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Database-backed fixed-window limiter. It works across serverless instances
 * because the counter lives in Postgres. If the database is unavailable the
 * limiter fails open: a database outage should not make sign-in impossible,
 * and authentication still verifies the password.
 */
export async function checkRateLimit(
  action: keyof typeof authLimits,
  identifier = "",
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = authLimits[action];
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const ip = await requestIp();
  const key = `${action}:${digest(`${ip}:${identifier.trim().toLowerCase()}`)}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowMs);

  try {
    const record = await prisma.authRateLimit.upsert({
      where: { key },
      update: { attempts: { increment: 1 } },
      create: { key, attempts: 1, expiresAt },
      select: { attempts: true, expiresAt: true },
    });

    if (Math.random() < 0.02) {
      await prisma.authRateLimit
        .deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch(() => undefined);
    }

    if (record.attempts > limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((record.expiresAt.getTime() - Date.now()) / 1000)),
      };
    }
    return { ok: true };
  } catch (error) {
    console.error("Rate limiter unavailable; allowing request", error);
    return { ok: true };
  }
}

export async function clearRateLimit(action: keyof typeof authLimits, identifier = "") {
  const { windowSeconds } = authLimits[action];
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const ip = await requestIp();
  const key = `${action}:${digest(`${ip}:${identifier.trim().toLowerCase()}`)}:${bucket}`;
  await prisma.authRateLimit.deleteMany({ where: { key } }).catch(() => undefined);
}

export function rateLimitMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
