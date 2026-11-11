import "server-only";

import { siteUrl } from "./site";

/**
 * Transactional email is optional. The storefront already runs without it, so
 * account flows must degrade honestly rather than pretending an email arrived.
 *
 * Configure both RESEND_API_KEY and EMAIL_FROM to enable delivery through
 * Resend's HTTPS API (no extra SDK). In development the message is logged to
 * the server console so the verification/reset links remain testable.
 */
export function emailDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export function accountUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

type Message = {
  to: string;
  subject: string;
  heading: string;
  body: string[];
  action?: { label: string; url: string };
  footer?: string;
};

function plainText(message: Message) {
  return [
    message.heading,
    "",
    ...message.body,
    ...(message.action ? ["", `${message.action.label}: ${message.action.url}`] : []),
    "",
    message.footer ?? "Kavya Chocolat",
  ].join("\n");
}

function html(message: Message) {
  const paragraphs = message.body
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#5b463b">${escapeHtml(line)}</p>`,
    )
    .join("");
  const action = message.action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(message.action.url)}" style="display:inline-block;background:#75212f;color:#f6efe3;padding:12px 20px;text-decoration:none;font-size:12px;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(message.action.label)}</a></p>
       <p style="margin:0 0 12px;font-size:12px;line-height:1.6;color:#5b463b">If the button does not work, copy this link:<br><span style="word-break:break-all">${escapeHtml(message.action.url)}</span></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6efe3;padding:32px;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#fcf8f0;border:1px solid #d8c6ac;padding:28px">
      <p style="margin:0 0 20px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#7a5726">Kavya Chocolat</p>
      <h1 style="margin:0 0 18px;font-size:26px;line-height:1.2;color:#24140f;font-weight:600">${escapeHtml(message.heading)}</h1>
      ${paragraphs}${action}
      <p style="margin:24px 0 0;border-top:1px solid #d8c6ac;padding-top:14px;font-size:11px;line-height:1.6;color:#5b463b">${escapeHtml(message.footer ?? "Kavya Chocolat · Small-batch chocolate, made in India")}</p>
    </div>
  </body></html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailResult = { sent: true } | { sent: false; reason: "not_configured" | "failed" };

export async function sendAccountEmail(message: Message): Promise<EmailResult> {
  if (!emailDeliveryConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[kavya] Email not configured. ${message.subject} → ${message.to}\n${plainText(message)}`,
      );
    }
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: plainText(message),
        html: html(message),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Resend rejected an account email", response.status, await response.text());
      return { sent: false, reason: "failed" };
    }
    return { sent: true };
  } catch (error) {
    console.error("Account email failed", error);
    return { sent: false, reason: "failed" };
  }
}
