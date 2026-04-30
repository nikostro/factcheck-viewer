import { test, expect } from "@playwright/test";
import { fixtureHashUrl } from "./fixtures/make-hash";

test.describe("interactions", () => {
  test("typing in search keeps focus and caret position", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const search = page.locator("#searchInput");
    await search.click();
    await page.keyboard.type("brid", { delay: 30 });

    // Focus persists across the re-renders triggered by each keystroke
    await expect(search).toBeFocused();

    const caret = await search.evaluate((el) => (el as HTMLInputElement).selectionStart);
    expect(caret).toBe(4);

    await expect(search).toHaveValue("brid");
  });

  test("dragging the resizer changes the layout split", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    const layout = page.locator(".layout");
    const before = await layout.evaluate((el) => getComputedStyle(el).getPropertyValue("--split-pct").trim());

    const resizer = page.locator("#paneResizer");
    const box = await resizer.boundingBox();
    if (!box) throw new Error("resizer not visible");

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 200, startY, { steps: 10 });
    await page.mouse.up();

    const after = await layout.evaluate((el) => getComputedStyle(el).getPropertyValue("--split-pct").trim());
    expect(parseFloat(after)).not.toBeCloseTo(parseFloat(before || "50"), 1);
    // Stays clamped
    expect(parseFloat(after)).toBeGreaterThanOrEqual(25);
    expect(parseFloat(after)).toBeLessThanOrEqual(75);
  });

  test("'New fact check' returns to the loader", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    await expect(page.locator("#pasteBox")).toHaveCount(0);

    await page.locator("#newFactCheckBtn").click();
    await expect(page.locator("#pasteBox")).toBeVisible();
    // NOTE: 'New fact check' does NOT currently clear the hash —
    // only 'Load different document' (#reloadBtn) does. That's a UX
    // inconsistency worth fixing separately; covered by the
    // hash-loader spec for the reloadBtn path.
  });

  test("'Reset fact check' closes the open claim panel", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    await page.locator('[data-open-claim="C2"]').first().click();
    await expect(page.locator(".inline-detail")).toBeVisible();
    await page.locator("#resetFactCheckBtn").click();
    await expect(page.locator(".inline-detail")).toHaveCount(0);
  });
});
