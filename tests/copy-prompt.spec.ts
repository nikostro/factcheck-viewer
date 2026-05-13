import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function readClipboard(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

test.describe("loader copy prompt button", () => {
  test("copies the fact_checking_prompt.md contents to the clipboard", async ({ page }) => {
    await page.goto("/");

    const btn = page.locator("#copyPromptBtn");
    await expect(btn).toContainText("Copy prompt");

    await btn.click();
    await expect(btn).toContainText("Copied");

    const expected = readFileSync(
      join(__dirname, "..", "fact_checking_prompt.md"),
      "utf8",
    );
    const plain = await readClipboard(page);
    expect(plain).toBe(expected);

    await expect(btn).toContainText("Copy prompt", { timeout: 3000 });
  });
});
