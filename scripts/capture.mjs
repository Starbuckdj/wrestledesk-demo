import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const artifactDir = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";
await mkdir("screenshots", { recursive: true });
await mkdir(artifactDir, { recursive: true });

const shots = [
  ["/", "homepage.png", { width: 1440, height: 900 }],
  ["/app/dashboard.html", "dashboard.png", { width: 1440, height: 900 }],
  ["/app/checkin.html", "checkin.png", { width: 1440, height: 900 }],
  ["/app/billing.html?tab=queue", "billing.png", { width: 1440, height: 900 }],
  ["/app/family.html?id=alvarez", "members-family.png", { width: 1440, height: 900 }],
  ["/app/parent.html", "parent-portal.png", { width: 390, height: 844 }],
];

const browser = await chromium.launch();
for (const [path, name, viewport] of shots) {
  const page = await browser.newPage({ viewport });
  await page.goto(base + path, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("h1");
  const target = `screenshots/${name}`;
  await page.screenshot({ path: target });
  await page.screenshot({ path: `${artifactDir}/${name}` });
  console.log(target);
  await page.close();
}
await browser.close();
