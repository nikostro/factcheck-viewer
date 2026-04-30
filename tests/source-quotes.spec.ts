import { test, expect } from "@playwright/test";
import { fixtureHashUrl, loadFixture } from "./fixtures/make-hash";

type Source = { title: string; url: string; quote?: string };
type Claim = { id: string; sources?: Source[]; sourceQuote?: string };
type Doc = { claims: Claim[] };

async function readClipboard(page: import("@playwright/test").Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

test.describe("source quotes (canonical shape)", () => {
  test("each source[i].quote renders in its own card with link + copy icon", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claim = fixture.claims.find(c => (c.sources?.length ?? 0) >= 2)!;
    await page.locator(`[data-open-claim="${claim.id}"]`).first().click();

    const cards = page.locator(".source-quote-card");
    await expect(cards).toHaveCount(claim.sources!.length);

    const firstSource = claim.sources![0];
    const firstCard = cards.first();
    await expect(firstCard.locator("blockquote")).toContainText(firstSource.quote!);

    const link = firstCard.locator("a.source-quote-link");
    await expect(link).toHaveAttribute("href", firstSource.url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noreferrer/);
    await expect(link).toContainText(firstSource.title);

    await expect(firstCard.locator(".copy-url-btn")).toBeVisible();
  });

  test("clicking the copy-URL icon copies the URL and does not navigate", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const fixture = loadFixture("canonical") as Doc;
    const claim = fixture.claims.find(c => (c.sources?.length ?? 0) >= 1)!;
    await page.locator(`[data-open-claim="${claim.id}"]`).first().click();

    const startUrl = page.url();
    await page.locator(".source-quote-card .copy-url-btn").first().click();
    expect(page.url()).toBe(startUrl);

    const text = await readClipboard(page);
    expect(text).toBe(claim.sources![0].url);
  });
});

test.describe("source quotes (legacy shape)", () => {
  test("top-level sourceQuote renders as quote-only card; sources render below as link cards", async ({ page }) => {
    await page.goto(fixtureHashUrl("legacy"));
    await page.locator('[data-open-claim="L1"]').first().click();

    const cards = page.locator(".source-quote-card");
    // 1 legacy quote-only + 2 quote-less sources = 3 cards
    await expect(cards).toHaveCount(3);

    // First card is the legacy quote, no link
    await expect(cards.nth(0).locator("blockquote")).toContainText("Legacy top-level quote text");
    await expect(cards.nth(0).locator("a.source-quote-link")).toHaveCount(0);

    // Following cards are link-only (no blockquote)
    await expect(cards.nth(1).locator("blockquote")).toHaveCount(0);
    await expect(cards.nth(1).locator("a.source-quote-link")).toContainText("Legacy source A");
  });

  test("no sources and no sourceQuote → empty placeholder", async ({ page }) => {
    await page.goto(fixtureHashUrl("legacy"));
    await page.locator('[data-open-claim="L2"]').first().click();
    await expect(page.locator(".source-quote-card")).toHaveCount(0);
    await expect(page.locator(".empty")).toContainText(/no directly linkable public source/i);
  });
});
