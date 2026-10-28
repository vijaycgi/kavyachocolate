import puppeteer from "puppeteer-core";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const base = "http://localhost:3001";
const outDir = ".impeccable/shots";
fs.mkdirSync(outDir, { recursive: true });

const prisma = new PrismaClient();
const order = await prisma.order.findFirst({
  where: { email: "e2e.checkout@example.com" },
  select: { id: true, orderNumber: true },
});
if (!order) throw new Error("No e2e order to test with");

// Put the test order back at the start of its lifecycle so the UI transition is testable.
await prisma.order.update({ where: { id: order.id }, data: { status: "PLACED" } });
await prisma.orderEvent.deleteMany({ where: { orderId: order.id, type: { not: "PLACED" } } });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  protocolTimeout: 120000,
  args: ["--hide-scrollbars", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

const log = (...args) => console.log(...args);

async function waitForUrl(fragment, timeout = 30000) {
  await page.waitForFunction(
    (value) => location.href.includes(value),
    { timeout },
    fragment,
  );
}

async function waitForPath(path, timeout = 30000) {
  await page.waitForFunction(
    (value) => location.pathname === value,
    { timeout },
    path,
  );
}

async function clickText(text, selector = "button") {
  const handle = await page.evaluateHandle(
    (label, tag) =>
      [...document.querySelectorAll(tag)].find((element) =>
        element.textContent?.toLowerCase().includes(label.toLowerCase()),
      ),
    text,
    selector,
  );
  const element = handle.asElement();
  if (!element) throw new Error(`No ${selector} with text ${text}`);
  return element;
}

// 1. Login form.
await page.goto(`${base}/admin/login`, { waitUntil: "networkidle0" });
await page.type("#email", "admin@kavya.local");
await page.type("#password", "ChangeMe123!");
await (await clickText("Sign in")).click();
await waitForPath("/admin");
const loginText = await page.evaluate(() => document.body.innerText);
log("login landed on:", page.url());
log("dashboard greeting:", loginText.includes("Good morning, Kavya"));

// 2. Order status update.
await page.goto(`${base}/admin/orders/${order.id}`, { waitUntil: "networkidle0" });
await page.select("#status", "PROCESSING");
await (await clickText("Update status")).click();
await waitForUrl("saved=status");
const statusText = await page.evaluate(() => document.body.innerText);
log("status flash:", statusText.includes("Order status updated."));
log("status badge:", statusText.includes("PROCESSING") || statusText.includes("Processing"));
await page.screenshot({ path: `${outDir}/admin-order-updated.png`, fullPage: true });

// 3. Inventory adjustment (+1 classic 70 g).
await page.goto(`${base}/admin/inventory`, { waitUntil: "networkidle0" });
const variantValue = await page.evaluate(() => {
  const select = document.querySelector("#variantId");
  const option = [...select.options].find((item) => item.textContent.includes("KC-C70-070"));
  return option?.value;
});
await page.select("#variantId", variantValue);
await page.type("#delta", "1");
await page.select("#reason", "RESTOCK");
await page.type("#note", "E2E restock check");
await (await clickText("Apply")).click();
await waitForUrl("saved=");
const invText = await page.evaluate(() => document.body.innerText);
log("inventory flash:", invText.includes("Saved."));
const stockRow = await prisma.variant.findUnique({ where: { sku: "KC-C70-070" } });
log("classic 70g stock after UI restock:", stockRow?.stock);
await page.screenshot({ path: `${outDir}/admin-inventory-updated.png`, fullPage: true });

// 4. Settings save.
await page.goto(`${base}/admin/settings`, { waitUntil: "networkidle0" });
const originalAnnouncement = await page.$eval("#store\\.announcement", (input) => input.value);
await page.$eval("#store\\.announcement", (input, value) => {
  input.value = value;
}, "E2E test announcement");
await (await clickText("Save settings")).click();
await waitForUrl("saved=1");
const settingsText = await page.evaluate(() => document.body.innerText);
log("settings flash:", settingsText.includes("Settings saved"));

const storefront = await browser.newPage();
await storefront.goto(base, { waitUntil: "networkidle0" });
const announcement = await storefront.evaluate(() => document.body.innerText);
log(
  "storefront stores new announcement:",
  announcement.toLowerCase().includes("e2e test announcement"),
);
await storefront.close();

// Restore the original announcement through the UI.
await page.$eval("#store\\.announcement", (input, value) => {
  input.value = value;
}, originalAnnouncement);
await (await clickText("Save settings")).click();
await waitForUrl("saved=1");
log("announcement restored");

// 5. Password rotation and re-login.
await page.goto(`${base}/admin/settings`, { waitUntil: "networkidle0" });
await page.type("#currentPassword", "ChangeMe123!");
await page.type("#newPassword", "E2E-Temp-Pass-123");
await page.type("#confirmPassword", "E2E-Temp-Pass-123");
await (await clickText("Change password")).click();
await waitForUrl("saved=password");
const passwordText = await page.evaluate(() => document.body.innerText);
log("password flash:", passwordText.includes("Password changed."));
log("still signed in:", passwordText.includes("Signed in as"));
await new Promise((resolve) => setTimeout(resolve, 600));

// Sign out, then back in with the temporary password.
await (await clickText("Sign out")).click();
await waitForUrl("/admin/login");
await page.type("#email", "admin@kavya.local");
await page.type("#password", "E2E-Temp-Pass-123");
await (await clickText("Sign in")).click();
await waitForPath("/admin");
log("temp password works:", page.url().includes("/admin"));

// Restore the original password.
await page.goto(`${base}/admin/settings`, { waitUntil: "networkidle0" });
await page.type("#currentPassword", "E2E-Temp-Pass-123");
await page.type("#newPassword", "ChangeMe123!");
await page.type("#confirmPassword", "ChangeMe123!");
await (await clickText("Change password")).click();
await waitForUrl("saved=password");
log("password restored");
await new Promise((resolve) => setTimeout(resolve, 600));

// Verify the original password works after a fresh sign-out/sign-in.
await (await clickText("Sign out")).click();
await waitForUrl("/admin/login");
await page.type("#email", "admin@kavya.local");
await page.type("#password", "ChangeMe123!");
await (await clickText("Sign in")).click();
await waitForPath("/admin");
log("original password works:", page.url().includes("/admin"));
await page.screenshot({ path: `${outDir}/admin-after-e2e.png`, fullPage: false });

console.log("ORDER", order.orderNumber);
console.log("ERRORS", JSON.stringify(errors, null, 2));
await browser.close();
await prisma.$disconnect();
