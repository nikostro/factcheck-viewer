import { test, expect } from "@playwright/test";
import { fixtureHashUrl, loadFixture } from "./fixtures/make-hash";

type Source = { title: string; url: string; quote?: string };
type Claim = { id: string; sources?: Source[] };
type Doc = { claims: Claim[] };

async function readClipboard(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

test.describe("source quotes", () => {
  test("each source renders as one card with quote, title, and copy icon", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claim = fixture.claims.find(c => (c.sources?.length ?? 0) >= 2)!;
    await page.locator(`[data-open-claim="${claim.id}"]`).first().click();

    const cards = page.locator(".source-quote-card");
    await expect(cards).toHaveCount(claim.sources!.length);

    const firstSource = claim.sources![0];
    const firstCard = cards.first();
    await expect(firstCard.locator("blockquote")).toContainText(firstSource.quote!);
    await expect(firstCard.locator(".source-quote-title")).toContainText(firstSource.title);
    await expect(firstCard.locator(".copy-url-btn")).toBeVisible();
    await expect(firstCard).toHaveAttribute("data-source-url", firstSource.url);
    await expect(firstCard).toHaveAttribute("role", "link");
  });

  test("clicking the card opens the URL in a new tab", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claim = fixture.claims.find(c => (c.sources?.length ?? 0) >= 1)!;
    await page.locator(`[data-open-claim="${claim.id}"]`).first().click();

    // Stub window.open to capture the call without doing a real navigation
    await page.evaluate(() => {
      (window as unknown as { __openedUrls: string[] }).__openedUrls = [];
      window.open = ((url: string) => {
        (window as unknown as { __openedUrls: string[] }).__openedUrls.push(url);
        return null;
      }) as typeof window.open;
    });

    await page.locator(".source-quote-card").first().click();

    const opened = await page.evaluate(() => (window as unknown as { __openedUrls: string[] }).__openedUrls);
    expect(opened).toEqual([claim.sources![0].url]);
  });

  test("Enter key on a focused card also opens the URL", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claim = fixture.claims.find(c => (c.sources?.length ?? 0) >= 1)!;
    await page.locator(`[data-open-claim="${claim.id}"]`).first().click();

    await page.evaluate(() => {
      (window as unknown as { __openedUrls: string[] }).__openedUrls = [];
      window.open = ((url: string) => {
        (window as unknown as { __openedUrls: string[] }).__openedUrls.push(url);
        return null;
      }) as typeof window.open;
    });

    await page.locator(".source-quote-card").first().focus();
    await page.keyboard.press("Enter");

    const opened = await page.evaluate(() => (window as unknown as { __openedUrls: string[] }).__openedUrls);
    expect(opened).toEqual([claim.sources![0].url]);
  });

  test("clicking the copy-URL button copies the URL and does not navigate", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claim = fixture.claims.find(c => (c.sources?.length ?? 0) >= 1)!;
    await page.locator(`[data-open-claim="${claim.id}"]`).first().click();

    const startUrl = page.url();
    let popups = 0;
    page.context().on("page", () => { popups += 1; });
    await page.locator(".source-quote-card .copy-url-btn").first().click();
    expect(page.url()).toBe(startUrl);
    // Wait briefly to confirm no popup opens
    await page.waitForTimeout(150);
    expect(popups).toBe(0);

    const text = await readClipboard(page);
    expect(text).toBe(claim.sources![0].url);
  });

  test("source without a quote renders as link-only (no blockquote)", async ({ page }) => {
    await page.goto(fixtureHashUrl("legacy"));
    await page.locator('[data-open-claim="L1"]').first().click();
    const cards = page.locator(".source-quote-card");
    // Legacy doc has 2 sources, neither has a quote → 2 link-only cards
    await expect(cards).toHaveCount(2);
    await expect(cards.first().locator("blockquote")).toHaveCount(0);
    await expect(cards.first().locator(".source-quote-title")).toContainText("Legacy source A");
  });

  test("top-level sourceQuote on a claim is ignored (no longer rendered)", async ({ page }) => {
    await page.goto(fixtureHashUrl("legacy"));
    await page.locator('[data-open-claim="L1"]').first().click();
    // The legacy fixture has a top-level sourceQuote — must NOT appear anywhere
    await expect(page.locator(".inline-detail")).not.toContainText("Legacy top-level quote text");
  });

  test("no sources at all → empty placeholder", async ({ page }) => {
    await page.goto(fixtureHashUrl("legacy"));
    await page.locator('[data-open-claim="L2"]').first().click();
    await expect(page.locator(".source-quote-card")).toHaveCount(0);
    await expect(page.locator(".empty")).toContainText(/no directly linkable public source/i);
  });
});
