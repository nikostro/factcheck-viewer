import { test, expect } from "@playwright/test";
import { fixtureHashUrl, loadFixture } from "./fixtures/make-hash";

type Claim = { id: string; correction?: string; snippet?: string };
type Doc = { claims: Claim[] };

async function readClipboard(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

test.describe("per-claim copy button", () => {
  test("claim with correction → label is 'Copy correction', clipboard has raw markdown", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claimWith = fixture.claims.find(c => c.correction)!;
    await page.locator(`[data-open-claim="${claimWith.id}"]`).first().click();

    const btn = page.locator("#copyCorrectionBtn");
    await expect(btn).toContainText("Copy correction");

    await btn.click();
    await expect(btn).toContainText("Copied");

    const text = await readClipboard(page);
    expect(text).toBe(claimWith.correction);

    // Reverts after the timeout
    await expect(btn).toContainText("Copy correction", { timeout: 3000 });
  });

  test("claim without correction → label is 'Copy quote', clipboard has snippet", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claimWithout = fixture.claims.find(c => !c.correction)!;
    await page.locator(`[data-open-claim="${claimWithout.id}"]`).first().click();

    const btn = page.locator("#copyCorrectionBtn");
    await expect(btn).toContainText("Copy quote");

    await btn.click();
    const text = await readClipboard(page);
    expect(text).toBe(claimWithout.snippet);
  });
});
