import { test, expect } from "@playwright/test";
import { fixtureHashUrl } from "./fixtures/make-hash";

test.describe("correction box", () => {
  test("renders strikethrough, bold, and link from markdown subset", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    // Open the red claim that has a correction
    await page.locator('[data-open-claim="C2"]').first().click();
    const box = page.locator(".correction-box");
    await expect(box).toBeVisible();
    await expect(box.locator("s")).toContainText("doubled");
    await expect(box.locator("strong")).toContainText("grew about 32%");
    const link = box.locator("a");
    await expect(link).toHaveAttribute("href", "https://example.com/transit");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toContainText("Transit data");
  });

  test("claim without correction → no box", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    await page.locator('[data-open-claim="C1"]').first().click();
    await expect(page.locator(".correction-box")).toHaveCount(0);
  });

  test("XSS payloads in correction are escaped, not executed", async ({ page }) => {
    await page.goto(fixtureHashUrl("xss"));
    await page.locator('[data-open-claim="X1"]').first().click();
    await expect(page.locator(".correction-box")).toBeVisible();

    // Inline <script> and onerror attribute did not execute
    const pwned = await page.evaluate(() => ({
      script: (window as unknown as { __pwned?: number }).__pwned,
      img: (window as unknown as { __pwned2?: number }).__pwned2,
    }));
    expect(pwned.script).toBeUndefined();
    expect(pwned.img).toBeUndefined();

    // No javascript: links should ever be in the rendered DOM
    const jsLinks = await page.locator('.correction-box a[href^="javascript:"]').count();
    expect(jsLinks).toBe(0);

    // The "valid" markdown tokens still render correctly
    await expect(page.locator(".correction-box s")).toContainText("bad");
    await expect(page.locator(".correction-box strong")).toContainText("fixed");
  });
});
