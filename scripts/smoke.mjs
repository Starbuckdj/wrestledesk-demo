import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const blocked = [];
page.on("request", (request) => {
  const url = request.url();
  if (/stripe|paypal|square|braintree|checkout\.com/i.test(url)) blocked.push(url);
});

async function go(path) {
  await page.goto(base + path, { waitUntil: "load" });
  await page.waitForSelector("h1");
}

await page.goto(base + "/", { waitUntil: "load" });
await page.evaluate(() => localStorage.clear());
await go("/");
await page.getByRole("link", { name: "Open the desk" }).first().click();
await page.waitForURL(/dashboard\.html/);
await page.getByText("Monthly dues on the books").waitFor();

await go("/app/checkin.html");
const luis = page.getByRole("row", { name: /Luis Alvarez/ });
await luis.getByRole("button", { name: "Check in" }).click();
await luis.getByRole("button", { name: "Undo" }).waitFor();

await go("/app/members.html");
await page.locator("select").nth(1).selectOption("past_due");
await page.getByRole("link", { name: "Brennan" }).waitFor();

await go("/app/family.html?id=alvarez");
await page.getByText("Sibling discount", { exact: true }).waitFor();
await page.getByText("$199.00").first().waitFor();

await go("/app/billing.html?tab=queue");
await page.getByRole("button", { name: "Mark reminder sent" }).first().click();
await page.getByText("Reminder sent").first().waitFor();

await go("/app/billing.html?flow=1");
await page.getByRole("button", { name: /Preview/ }).click();
await page.getByText("Email the parent would get").waitFor();
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("button", { name: "Queue the run" }).click();
await page.getByText(/invoices queued/i).waitFor();

await go("/app/waivers.html");
await page.locator("tbody input[type=checkbox]").first().check();
await page.getByRole("button", { name: "Send waiver" }).click();
await page.getByRole("button", { name: /Queue/ }).click();
await page.getByText(/marked sent/i).waitFor();

await go("/app/schedule.html");
await page.getByRole("link", { name: /High school/ }).first().click();
await page.waitForURL(/checkin\.html/);

await go("/app/coaches.html");
await page.getByText("USA Wrestling coach card").first().waitFor();

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(base + "/app/parent.html", { waitUntil: "load" });
await phone.getByRole("button", { name: "Pay" }).click();
await phone.getByRole("button", { name: "Submit payment" }).click();
await phone.getByText(/Nothing was charged/i).waitFor();
await phone.getByRole("button", { name: "Sign" }).first().click();
await phone.getByText(/waiver is signed/i).waitFor();

if (blocked.length) {
  console.error("Blocked payment requests:", blocked);
  process.exit(1);
}
console.log("smoke ok");
await browser.close();
