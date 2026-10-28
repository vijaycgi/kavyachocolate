import puppeteer from "puppeteer-core";
import fs from "node:fs";

const base = "http://localhost:3001";
const outDir = ".impeccable/shots";
fs.mkdirSync(outDir, { recursive: true });

const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const token = process.env.ADMIN_TOKEN;

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  protocolTimeout: 120000,
  args: ["--hide-scrollbars", "--disable-gpu"],
});

const errors = [];

async function shot(name, path, viewport, options = {}) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${name}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));

  if (token && options.admin) {
    await page.setCookie({
      name: "kavya_admin_session",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    });
  }

  await page.goto(base + path, { waitUntil: "networkidle0", timeout: 60000 });

  if (options.scroll) {
    await page.evaluate(async () => {
      document.querySelectorAll("img").forEach((image) => {
        image.loading = "eager";
      });
      const height = document.body.scrollHeight;
      for (let y = 0; y < height; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 1500));
    });
  }

  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  console.log("shot", name, "|", await page.title(), "| width", await page.evaluate(() => document.body.scrollWidth));
  await page.close();
}

const desktop = { width: 1440, height: 960, deviceScaleFactor: 1 };
const mobile = { width: 390, height: 844, deviceScaleFactor: 2 };

await shot("home-desktop", "/", desktop, { scroll: true });
await shot("home-mobile", "/", mobile, { scroll: true });
await shot("shop-desktop", "/shop", desktop, { scroll: true });
await shot("shop-mobile", "/shop", mobile, { scroll: true });
await shot("product-desktop", "/products/classic-70-dark-chocolate", desktop, { scroll: true });
await shot("product-mobile", "/products/jaggery-sweetened-dark-chocolate", mobile, { scroll: true });
await shot("checkout-mobile", "/checkout", mobile, { scroll: true });
await shot("track-mobile", "/track-order", mobile, { scroll: true });
await shot("login-mobile", "/admin/login", mobile);
await shot("login-desktop", "/admin/login", desktop);
if (token) {
  await shot("admin-mobile", "/admin", mobile, { admin: true, scroll: true });
  await shot("admin-desktop", "/admin", desktop, { admin: true, scroll: true });
  await shot("orders-desktop", "/admin/orders", desktop, { admin: true });
  await shot("order-detail-desktop", "/admin/orders", desktop, { admin: true });
  await shot("settings-desktop", "/admin/settings", desktop, { admin: true, scroll: true });
  await shot("settings-mobile", "/admin/settings", mobile, { admin: true, scroll: true });
  await shot("inventory-desktop", "/admin/inventory", desktop, { admin: true });
  await shot("shipping-desktop", "/admin/shipping", desktop, { admin: true });
}

console.log("ERRORS", JSON.stringify(errors, null, 2));
await browser.close();
