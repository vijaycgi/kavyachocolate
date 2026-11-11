"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  authenticateCustomer,
  changeCustomerPassword,
  createCustomerSession,
  CustomerAuthError,
  destroyCustomerSession,
  getCustomer,
  registerCustomer,
  requestPasswordReset,
  resetCustomerPassword,
  revokeOtherCustomerSessions,
  safeAccountNext,
  sendVerificationEmail,
  updateCustomerProfile,
  verifyCustomerEmail,
} from "@/lib/customer-auth";
import {
  checkRateLimit,
  clearRateLimit,
  rateLimitMessage,
} from "@/lib/rate-limit";
import {
  addressSchema,
  changeCustomerPasswordSchema,
  fieldErrorsFromZod,
  firstFieldError,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import { initialCustomerFormState, type CustomerFormState } from "./form-state";

export async function customerLoginAction(
  _previous: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: firstFieldError(fieldErrorsFromZod(parsed.error)),
      fieldErrors: fieldErrorsFromZod(parsed.error),
      values: { email: raw.email },
    };
  }

  const limited = await checkRateLimit("login", parsed.data.email);
  if (!limited.ok) return { status: "error", message: rateLimitMessage(limited.retryAfterSeconds) };

  const customer = await authenticateCustomer(parsed.data.email, parsed.data.password);
  if (!customer) {
    return {
      status: "error",
      message: "That email and password do not match an account.",
      fieldErrors: { form: "That email and password do not match an account." },
      values: { email: parsed.data.email },
    };
  }

  await clearRateLimit("login", parsed.data.email);
  await createCustomerSession(customer.id);
  redirect(safeAccountNext(String(formData.get("next") ?? "")));
}

export async function customerRegisterAction(
  _previous: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    acceptTerms: formData.get("acceptTerms") === "on",
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromZod(parsed.error);
    return {
      status: "error",
      message: firstFieldError(fieldErrors),
      fieldErrors,
      values: { name: raw.name, email: raw.email },
    };
  }

  const limited = await checkRateLimit("register");
  if (!limited.ok) return { status: "error", message: rateLimitMessage(limited.retryAfterSeconds) };

  try {
    const result = await registerCustomer({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    revalidatePath("/account");
    redirect(`/account?welcome=1&verify=${result.verificationSent ? "sent" : "pending"}`);
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return {
        status: "error",
        message: error.message,
        fieldErrors: error.field ? { [error.field]: error.message } : undefined,
        values: { name: raw.name, email: raw.email },
      };
    }
    console.error("Registration failed", error);
    return {
      status: "error",
      message: "We could not create the account. Please try again.",
      values: { name: raw.name, email: raw.email },
    };
  }
}

export async function forgotPasswordAction(
  _previous: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const raw = { email: String(formData.get("email") ?? "") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromZod(parsed.error);
    return {
      status: "error",
      message: firstFieldError(fieldErrors),
      fieldErrors,
      values: { email: raw.email },
    };
  }

  const limited = await checkRateLimit("forgotPassword", parsed.data.email);
  if (!limited.ok) return { status: "error", message: rateLimitMessage(limited.retryAfterSeconds) };

  // Deliberately identical for unknown and known email addresses.
  await requestPasswordReset(parsed.data.email).catch((error) => {
    console.error("Password reset request failed", error);
  });
  redirect("/account/forgot-password?sent=1");
}

export async function resetPasswordAction(
  _previous: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const token = String(formData.get("token") ?? "");
  const raw = {
    token,
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromZod(parsed.error);
    return { status: "error", message: firstFieldError(fieldErrors), fieldErrors };
  }

  const limited = await checkRateLimit("resetPassword");
  if (!limited.ok) return { status: "error", message: rateLimitMessage(limited.retryAfterSeconds) };

  try {
    await resetCustomerPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return {
        status: "error",
        message: error.message,
        fieldErrors: error.field ? { [error.field]: error.message } : undefined,
      };
    }
    console.error("Password reset failed", error);
    return { status: "error", message: "We could not reset the password. Request a new link." };
  }

  redirect("/account/login?reset=1");
}

export async function customerLogoutAction() {
  await destroyCustomerSession();
  redirect("/account/login?loggedout=1");
}

export async function updateProfileAction(
  _previous: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const customer = await getCustomer();
  if (!customer) return { status: "error", message: "Your session expired. Sign in again." };

  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromZod(parsed.error);
    return {
      status: "error",
      message: firstFieldError(fieldErrors),
      fieldErrors,
      values: raw,
    };
  }

  try {
    await updateCustomerProfile(customer.id, parsed.data);
  } catch (error) {
    console.error("Profile update failed", error);
    return { status: "error", message: "We could not save your profile. Try again." };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { status: "success", message: "Profile updated." };
}

export async function changePasswordAction(
  _previous: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const customer = await getCustomer();
  if (!customer) return { status: "error", message: "Your session expired. Sign in again." };

  const raw = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = changeCustomerPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromZod(parsed.error);
    return { status: "error", message: firstFieldError(fieldErrors), fieldErrors };
  }

  try {
    await changeCustomerPassword(customer, parsed.data.currentPassword ?? "", parsed.data.password);
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return {
        status: "error",
        message: error.message,
        fieldErrors: error.field ? { [error.field]: error.message } : undefined,
      };
    }
    console.error("Password change failed", error);
    return { status: "error", message: "We could not change the password. Try again." };
  }

  revalidatePath("/account/security");
  return { status: "success", message: "Password updated. Other devices have been signed out." };
}

export async function revokeOtherSessionsAction() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?reason=session");
  await revokeOtherCustomerSessions(customer.id);
  revalidatePath("/account/security");
  redirect("/account/security?saved=sessions");
}

export async function verifyEmailAction(
  _previous: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { status: "error", message: "This verification link is incomplete." };
  try {
    await verifyCustomerEmail(token);
  } catch (error) {
    if (error instanceof CustomerAuthError) return { status: "error", message: error.message };
    console.error("Email verification failed", error);
    return { status: "error", message: "We could not verify the email. Request a new link." };
  }
  revalidatePath("/account");
  revalidatePath("/account/orders");
  redirect("/account?verified=1");
}

export async function resendVerificationAction(
  _previous: CustomerFormState = initialCustomerFormState,
): Promise<CustomerFormState> {
  void _previous;
  const customer = await getCustomer();
  if (!customer) return { status: "error", message: "Your session expired. Sign in again." };
  if (customer.emailVerifiedAt) return { status: "success", message: "Your email is already verified." };

  const limited = await checkRateLimit("register");
  if (!limited.ok) return { status: "error", message: rateLimitMessage(limited.retryAfterSeconds) };

  const sent = await sendVerificationEmail(customer);
  return {
    status: sent ? "success" : "error",
    message: sent
      ? "Verification email sent."
      : "Email delivery is not configured yet, so no message was sent. Your account still works.",
  };
}

export async function saveAddressAction(
  _previous: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const customer = await getCustomer();
  if (!customer) return { status: "error", message: "Your session expired. Sign in again." };

  const raw = {
    id: String(formData.get("id") ?? "") || undefined,
    label: String(formData.get("label") ?? ""),
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    line2: String(formData.get("line2") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? ""),
    isDefault: formData.get("isDefault") === "on",
  };
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFromZod(parsed.error);
    return {
      status: "error",
      message: firstFieldError(fieldErrors),
      fieldErrors,
      values: Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, String(value ?? "")])),
    };
  }

  const input = parsed.data;
  const data = {
    label: input.label || null,
    name: input.name,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2 || null,
    city: input.city,
    state: input.state || null,
    postalCode: input.postalCode,
    country: input.country,
    isDefault: Boolean(input.isDefault),
  };

  const addressCount = await prisma.address.count({
    where: { customerId: customer.id, orderId: null },
  });

  try {
    await prisma.$transaction(async (tx) => {
      if (input.id) {
        const updated = await tx.address.updateMany({
          where: { id: input.id, customerId: customer.id, orderId: null },
          data,
        });
        if (updated.count === 0) {
          throw new CustomerAuthError("That address was not found on your account.");
        }
      } else {
        await tx.address.create({
          data: {
            ...data,
            customerId: customer.id,
            kind: "SHIPPING",
            isDefault: data.isDefault || addressCount === 0,
          },
        });
      }

      const shouldBeDefault = data.isDefault || addressCount === 0;
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { customerId: customer.id, orderId: null, isDefault: true },
          data: { isDefault: false },
        });
        const target = input.id
          ? await tx.address.findFirst({
              where: { id: input.id, customerId: customer.id, orderId: null },
              select: { id: true },
            })
          : await tx.address.findFirst({
              where: { customerId: customer.id, orderId: null },
              orderBy: { createdAt: "desc" },
              select: { id: true },
            });
        if (target) {
          await tx.address.update({ where: { id: target.id }, data: { isDefault: true } });
        }
      }
    });
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      return { status: "error", message: error.message };
    }
    console.error("Address save failed", error);
    return { status: "error", message: "We could not save that address. Try again." };
  }

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { status: "success", message: input.id ? "Address updated." : "Address saved." };
}

export async function deleteAddressAction(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?reason=session");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.$transaction(async (tx) => {
      const target = await tx.address.findFirst({
        where: { id, customerId: customer.id, orderId: null },
        select: { id: true, isDefault: true },
      });
      if (!target) return;
      await tx.address.delete({ where: { id: target.id } });
      if (target.isDefault) {
        const next = await tx.address.findFirst({
          where: { customerId: customer.id, orderId: null },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (next) {
          await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
      }
    });
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  redirect("/account/addresses?saved=deleted");
}

export async function setDefaultAddressAction(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?reason=session");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.$transaction(async (tx) => {
      const target = await tx.address.findFirst({
        where: { id, customerId: customer.id, orderId: null },
        select: { id: true },
      });
      if (!target) return;
      await tx.address.updateMany({
        where: { customerId: customer.id, orderId: null },
        data: { isDefault: false },
      });
      await tx.address.update({ where: { id: target.id }, data: { isDefault: true } });
    });
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  redirect("/account/addresses?saved=default");
}

export async function unlinkGoogleAction(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?reason=session");
  if (!customer.passwordHash) {
    redirect(
      `/account/security?error=${encodeURIComponent(
        "Set a password before unlinking Google, or you would lose access to the account.",
      )}`,
    );
  }
  const provider = String(formData.get("provider") ?? "google");
  if (provider !== "google") redirect("/account/security");
  await prisma.oAuthAccount.deleteMany({
    where: { customerId: customer.id, provider: "google" },
  });
  revalidatePath("/account/security");
  redirect("/account/security?saved=unlinked");
}
