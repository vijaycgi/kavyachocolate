import puppeteer from "puppeteer-core";
import fs from "node:fs";

const base = "http://localhost:3001";
const outDir = ".impeccable/shots";
fs.mkdirSync(outDir, { recursive: true });

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

function log(...args) {
  console.log(...args);
}

// 1. Product page, choose the 150 g variant, add to bag.
await page.goto(`${base}/products/classic-70-dark-chocolate`, { waitUntil: "networkidle0" });
const sizeButtons = await page.$$("button[aria-pressed]");
log("variant buttons:", sizeButtons.length);
for (const button of sizeButtons) {
  const text = await page.evaluate((element) => element.textContent, button);
  if (text && text.includes("150")) {
    await button.click();
    log("selected 150 g");
    break;
  }
}
const addButton = await page.evaluateHandle(() =>
  [...document.querySelectorAll("button")].find((button) =>
    button.textContent?.includes("Add to bag"),
  ),
);
await addButton.asElement().click();
await new Promise((resolve) => setTimeout(resolve, 600));

// 2. Drawer should open with the line.
const drawerOpen = await page.evaluate(() => document.body.textContent.includes("Your bag"));
log("cart drawer open:", drawerOpen);
const cartCount = await page.evaluate(() => {
  const raw = localStorage.getItem("kavya-cart-v1");
  return raw ? JSON.parse(raw).length : 0;
});
log("localStorage cart lines:", cartCount);
await page.screenshot({ path: `${outDir}/e2e-cart-drawer.png`, fullPage: false });

// 3. Reload and confirm persistence via the cart page.
await page.goto(`${base}/cart`, { waitUntil: "networkidle0" });
const cartText = await page.evaluate(() => document.body.innerText);
log("cart page has line:", cartText.includes("Classic 70% Dark Chocolate"));
await page.screenshot({ path: `${outDir}/e2e-cart.png`, fullPage: true });

// 4. Checkout.
await page.goto(`${base}/checkout`, { waitUntil: "networkidle0" });
const fill = async (selector, value) => {
  await page.click(selector);
  await page.type(selector, value, { delay: 10 });
};
await fill("#name", "E2E Checkout Tester");
await fill("#email", "e2e.checkout@example.com");
await fill("#phone", "+91 91234 56789");
await fill("#postalCode", "560001");
await fill("#line1", "44 Test Residency");
await fill("#city", "Bengaluru");
await fill("#state", "Karnataka");

await page.waitForFunction(
  () => document.body.innerText.includes("Courier shipping · India"),
  { timeout: 20000 },
);
const quoteText = await page.evaluate(() => {
  const text = document.body.innerText;
  const start = text.indexOf("Courier shipping · India");
  return text.slice(start, start + 160).split("\n").slice(0, 3).join(" | ");
});
log("quote:", quoteText);
await page.screenshot({ path: `${outDir}/e2e-checkout-filled.png`, fullPage: true });

// 5. Place order from the summary panel.
const placeButton = await page.$('button[form="checkout-form"]');
const disabled = await page.evaluate((element) => element.disabled, placeButton);
log("place order disabled before click:", disabled);

await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
  placeButton.click(),
]);

const successUrl = page.url();
log("success url:", successUrl);
const successText = await page.evaluate(() => document.body.innerText);
log("success has order number:", /KC-\d{6}-[A-Z0-9]{6}/.test(successText));
log("success says no payment:", successText.includes("No payment"));
const orderNumber = successText.match(/KC-\d{6}-[A-Z0-9]{6}/)?.[0];
log("order number:", orderNumber);
await page.screenshot({ path: `${outDir}/e2e-order-success.png`, fullPage: true });

// 6. Cart must be empty after success.
const storageAfter = await page.evaluate(() => localStorage.getItem("kavya-cart-v1"));
log("cart after success:", storageAfter);

// 7. Track the order.
await page.goto(`${base}/track-order`, { waitUntil: "networkidle0" });
await fill("#orderNumber", orderNumber ?? "");
await fill("#email", "e2e.checkout@example.com");
const trackButton = await page.evaluateHandle(() =>
  [...document.querySelectorAll("button")].find((button) =>
    button.textContent?.toLowerCase().includes("find my order"),
  ),
);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
  trackButton.asElement().click(),
]);
const trackUrl = page.url();
log("track redirect:", trackUrl);
const trackText = await page.evaluate(() => document.body.innerText);
log("track page found order:", trackText.includes(orderNumber ?? "___"));
await page.screenshot({ path: `${outDir}/e2e-track.png`, fullPage: true });

console.log("ORDER_NUMBER=" + orderNumber);
console.log("ERRORS", JSON.stringify(errors, null, 2));
await browser.close();
