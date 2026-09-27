import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import axe from "axe-core";
import puppeteer from "puppeteer";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3200";
const chromePath = process.env.CHROME_PATH;
const label = process.env.AUDIT_LABEL ?? "after";
const pages = ["/", "/results"];

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const report = [];
    for (const path of pages) {
      const page = await browser.newPage();
      await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
      await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle0" });
      await page.evaluate(axe.source);
      const result = await page.evaluate(() =>
        (
          window as typeof window & {
            axe: typeof axe;
          }
        ).axe.run(document, { reporter: "v2" }),
      );
      report.push({ path, violations: result.violations, passes: result.passes.length });
      await page.close();
    }

    await mkdir("reports", { recursive: true });
    await writeFile(
      join("reports", `axe-public-pages-${label}.json`),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    const violations = report.flatMap((entry) => entry.violations);
    console.log(`axe-core: ${violations.length} violation(s) across ${pages.length} page(s).`);
    if (violations.length > 0) {
      for (const violation of violations) console.error(`${violation.id}: ${violation.help}`);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

void main();
