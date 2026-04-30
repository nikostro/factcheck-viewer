import { test, expect } from "@playwright/test";
import { fixtureHashUrl, loadFixture } from "./fixtures/make-hash";

type Claim = { id: string; correction?: string; snippet?: string };
type Doc = { claims: Claim[] };

async function readClipboard(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

async function readClipboardHtml(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(async () => {
    const items = await navigator.clipboard.read();
    for (const it of items) {
      if (it.types.includes("text/html")) {
        const blob = await it.getType("text/html");
        return await blob.text();
      }
    }
    return "";
  });
}

test.describe("per-claim copy button", () => {
  test("claim with correction → clipboard has formatted HTML and raw markdown plain-text fallback", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claimWith = fixture.claims.find(c => c.correction)!;
    await page.locator(`[data-open-claim="${claimWith.id}"]`).first().click();

    const btn = page.locator("#copyCorrectionBtn");
    await expect(btn).toContainText("Copy correction");

    await btn.click();
    await expect(btn).toContainText("Copied");

    // Plain-text fallback is the raw markdown — paste-targets that
    // ignore HTML still get something useful.
    const plain = await readClipboard(page);
    expect(plain).toBe(claimWith.correction);

    // Rich text: Google Docs / mail clients pick up the formatted HTML.
    const html = await readClipboardHtml(page);
    expect(html).toContain("<s>");
    expect(html).toContain("<strong>");
    expect(html).toMatch(/<a href="https?:\/\//);

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
