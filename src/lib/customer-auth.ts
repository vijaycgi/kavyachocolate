import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Customer } from "@prisma/client";
import { cookieIsSecure } from "./cookies";
import { prisma } from "./db";
import { accountUrl, emailDeliveryConfigured, sendAccountEmail } from "./email";
import { safeAccountNext } from "./redirects";
import { passwordIssue } from "./validation";

export { safeAccountNext };

export const CUSTOMER_SESSION_COOKIE = "kavya_customer_session";
const SESSION_DAYS = 30;
const SESSION_RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

const DUMMY_HASH =
  "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";

export class CustomerAuthError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

export function hashCustomerToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCustomer() {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashCustomerToken(token) },
    include: { customer: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.customerSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  if (Date.now() - session.lastUsedAt.getTime() > SESSION_RENEW_AFTER_MS) {
    await prisma.customerSession
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => undefined);
  }

  return session.customer;
}

export async function requireCustomer() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?reason=session");
  return customer;
}

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.customerSession.create({
    data: { tokenHash: hashCustomerToken(token), customerId, expiresAt },
  });
  await prisma.customerSession
    .deleteMany({ where: { customerId, expiresAt: { lt: new Date() } } })
    .catch(() => undefined);

  (await cookies()).set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieIsSecure(),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCustomerSession() {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.customerSession
      .deleteMany({ where: { tokenHash: hashCustomerToken(token) } })
      .catch(() => undefined);
  }
  store.delete(CUSTOMER_SESSION_COOKIE);
}

export async function revokeOtherCustomerSessions(customerId: string) {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  await prisma.customerSession.deleteMany({
    where: {
      customerId,
      ...(token ? { tokenHash: { not: hashCustomerToken(token) } } : {}),
    },
  });
}

export async function authenticateCustomer(email: string, password: string) {
  const customer = await prisma.customer.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!customer?.passwordHash) {
    // Keep timing comparable whether the account exists, has a password, or not.
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }

  const valid = await bcrypt.compare(password, customer.passwordHash);
  return valid ? customer : null;
}

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResult = {
  customer: Customer;
  verificationSent: boolean;
  emailConfigured: boolean;
};

export async function registerCustomer(input: RegisterInput): Promise<RegisterResult> {
  const issue = passwordIssue(input.password);
  if (issue) throw new CustomerAuthError(issue, "password");

  const email = input.email.trim().toLowerCase();
  const existing = await prisma.customer.findUnique({
    where: { email },
    include: { oauthAccounts: { select: { id: true } } },
  });

  // Never attach a password to an established account. Doing so without
  // proving control of the mailbox would be an account-takeover path.
  if (existing && (existing.passwordHash || existing.oauthAccounts.length > 0)) {
    throw new CustomerAuthError("An account with this email already exists. Sign in instead.", "email");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  let customer: Customer;
  try {
    customer = existing
      ? await prisma.customer.update({
          where: { id: existing.id },
          data: { name: input.name.trim(), passwordHash },
        })
      : await prisma.customer.create({
          data: { email, name: input.name.trim(), passwordHash },
        });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw new CustomerAuthError("An account with this email already exists. Sign in instead.", "email");
    }
    throw error;
  }

  await createCustomerSession(customer.id);
  const verificationSent = await sendVerificationEmail(customer);
  return { customer, verificationSent, emailConfigured: emailDeliveryConfigured() };
}

const TOKEN_TYPES = {
  verify: "EMAIL_VERIFICATION",
  reset: "PASSWORD_RESET",
} as const;

async function createCustomerToken(customerId: string, type: string, minutes: number) {
  const token = randomBytes(32).toString("base64url");
  await prisma.customerToken.deleteMany({
    where: { customerId, type, usedAt: null },
  });
  await prisma.customerToken.create({
    data: {
      tokenHash: hashCustomerToken(token),
      customerId,
      type,
      expiresAt: new Date(Date.now() + minutes * 60 * 1000),
    },
  });
  return token;
}

export async function sendVerificationEmail(customer: Customer) {
  if (customer.emailVerifiedAt) return true;
  const token = await createCustomerToken(customer.id, TOKEN_TYPES.verify, 24 * 60);
  const result = await sendAccountEmail({
    to: customer.email,
    subject: "Verify your Kavya Chocolat email",
    heading: `Welcome, ${customer.name.split(" ")[0]}.`,
    body: [
      "Confirm this email address to finish setting up your Kavya Chocolat account.",
      "Verifying also links any earlier guest orders placed with this email to your account.",
    ],
    action: {
      label: "Verify email",
      url: accountUrl(`/account/verify-email?token=${encodeURIComponent(token)}`),
    },
    footer: "This link expires in 24 hours. If you did not create an account, ignore this email.",
  });
  return result.sent;
}

export async function requestPasswordReset(email: string) {
  const customer = await prisma.customer.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Always report the same outcome, whether or not an account exists.
  if (!customer?.passwordHash) return { requested: true, sent: false };

  const token = await createCustomerToken(customer.id, TOKEN_TYPES.reset, 60);
  const result = await sendAccountEmail({
    to: customer.email,
    subject: "Reset your Kavya Chocolat password",
    heading: "Choose a new password.",
    body: [
      "We received a request to reset the password for your Kavya Chocolat account.",
      "This link can be used once and expires in one hour.",
    ],
    action: {
      label: "Reset password",
      url: accountUrl(`/account/reset-password?token=${encodeURIComponent(token)}`),
    },
    footer: "If you did not request this, you can ignore the email. Your password has not changed.",
  });
  return { requested: true, sent: result.sent };
}

async function claimGuestOrders(customerId: string, email: string) {
  await prisma.order.updateMany({
    where: { email: email.trim().toLowerCase(), customerId: null },
    data: { customerId },
  });
}

export async function verifyCustomerEmail(rawToken: string) {
  const token = await prisma.customerToken.findUnique({
    where: { tokenHash: hashCustomerToken(rawToken) },
    include: { customer: true },
  });
  if (
    !token ||
    token.type !== TOKEN_TYPES.verify ||
    token.usedAt ||
    token.expiresAt.getTime() <= Date.now()
  ) {
    throw new CustomerAuthError("That verification link is invalid or has expired.");
  }

  const claimed = await prisma.customerToken.updateMany({
    where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) {
    throw new CustomerAuthError("That verification link has already been used.");
  }

  const customer = await prisma.customer.update({
    where: { id: token.customerId },
    data: { emailVerifiedAt: token.customer.emailVerifiedAt ?? new Date() },
  });
  await claimGuestOrders(customer.id, customer.email);
  return customer;
}

export async function resetCustomerPassword(rawToken: string, password: string) {
  const issue = passwordIssue(password);
  if (issue) throw new CustomerAuthError(issue, "password");

  const token = await prisma.customerToken.findUnique({
    where: { tokenHash: hashCustomerToken(rawToken) },
    include: { customer: true },
  });
  if (
    !token ||
    token.type !== TOKEN_TYPES.reset ||
    token.usedAt ||
    token.expiresAt.getTime() <= Date.now()
  ) {
    throw new CustomerAuthError("That reset link is invalid or has expired. Request a new one.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.customerToken.updateMany({
      where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new CustomerAuthError("That reset link has already been used.");
    }
    await tx.customer.update({
      where: { id: token.customerId },
      data: {
        passwordHash,
        // Opening the link proves control of the mailbox.
        emailVerifiedAt: token.customer.emailVerifiedAt ?? new Date(),
      },
    });
    await tx.customerSession.deleteMany({ where: { customerId: token.customerId } });
  });

  await claimGuestOrders(token.customerId, token.customer.email);
  return token.customerId;
}

export async function changeCustomerPassword(
  customer: Customer,
  currentPassword: string,
  nextPassword: string,
) {
  if (customer.passwordHash) {
    const valid = await bcrypt.compare(currentPassword, customer.passwordHash);
    if (!valid) throw new CustomerAuthError("The current password is not correct.", "currentPassword");
  }
  const issue = passwordIssue(nextPassword);
  if (issue) throw new CustomerAuthError(issue, "password");

  const passwordHash = await bcrypt.hash(nextPassword, 12);
  await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash } });
  // Rotate every session, then sign this browser back in.
  await prisma.customerSession.deleteMany({ where: { customerId: customer.id } });
  await createCustomerSession(customer.id);
}

export async function updateCustomerProfile(
  customerId: string,
  data: { name: string; phone?: string | null },
) {
  return prisma.customer.update({
    where: { id: customerId },
    data: { name: data.name.trim(), phone: data.phone?.trim() || null },
  });
}

export async function linkGoogleAccount(customerId: string, providerAccountId: string) {
  try {
    return await prisma.oAuthAccount.create({
      data: { provider: "google", providerAccountId, customerId },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw new CustomerAuthError("That Google account is already linked to another customer.");
    }
    throw error;
  }
}

export async function createGoogleCustomer(input: {
  email: string;
  name: string;
  providerAccountId: string;
}) {
  const email = input.email.trim().toLowerCase();
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: {
        email,
        name: input.name.trim() || email.split("@")[0],
        emailVerifiedAt: new Date(),
      },
    });
    await tx.oAuthAccount.create({
      data: { provider: "google", providerAccountId: input.providerAccountId, customerId: customer.id },
    });
    await tx.order.updateMany({
      where: { email, customerId: null },
      data: { customerId: customer.id },
    });
    return customer;
  });
}

export async function attachGoogleToGuestCustomer(customer: Customer, providerAccountId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.oAuthAccount.create({
      data: { provider: "google", providerAccountId, customerId: customer.id },
    });
    const updated = await tx.customer.update({
      where: { id: customer.id },
      data: { emailVerifiedAt: customer.emailVerifiedAt ?? new Date() },
    });
    await tx.order.updateMany({
      where: { email: customer.email, customerId: null },
      data: { customerId: customer.id },
    });
    return updated;
  });
}
