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

  test("'New fact check' returns to the loader and clears the hash", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    await expect(page.locator("#pasteBox")).toHaveCount(0);

    await page.locator("#newFactCheckBtn").click();
    await expect(page.locator("#pasteBox")).toBeVisible();
    expect(page.url()).not.toContain("#data_b64");
  });

  test("'Reset fact check' closes the open claim panel", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    await page.locator('[data-open-claim="C2"]').first().click();
    await expect(page.locator(".inline-detail")).toBeVisible();
    await page.locator("#resetFactCheckBtn").click();
    await expect(page.locator(".inline-detail")).toHaveCount(0);
  });

  test("opened claim panel scroll container fits inside the inline-detail bounds", async ({ page }) => {
    // Regression guard: the inline-detail must use flex so that the
    // modal-scroll fills only the remaining space and stays scrollable
    // — even on tall content or narrow panes.
    await page.goto(fixtureHashUrl("canonical"));
    await page.locator('[data-open-claim="C2"]').first().click();

    const detail = page.locator(".inline-detail");
    const scroll = page.locator(".inline-detail .modal-scroll");
    await expect(detail).toBeVisible();
    await expect(scroll).toBeVisible();

    const detailBox = await detail.boundingBox();
    const scrollBox = await scroll.boundingBox();
    if (!detailBox || !scrollBox) throw new Error("layout boxes not measurable");

    // The scroll region must end at or before the bottom of its container,
    // not spill past it (which would make the bottom content unreachable).
    expect(scrollBox.y + scrollBox.height).toBeLessThanOrEqual(detailBox.y + detailBox.height + 1);
    expect(scrollBox.height).toBeGreaterThan(0);

    // And it must actually be scrollable when content overflows. Force a
    // tall correction box by injecting padding via inline style and check
    // that scrollTop can move.
    await page.evaluate(() => {
      const s = document.querySelector(".inline-detail .modal-scroll") as HTMLElement | null;
      const body = document.querySelector(".correction-box .correction-body") as HTMLElement | null;
      if (s && body) body.style.minHeight = (s.clientHeight + 400) + "px";
    });
    await scroll.evaluate((el) => { (el as HTMLElement).scrollTop = 200; });
    const top = await scroll.evaluate((el) => (el as HTMLElement).scrollTop);
    expect(top).toBeGreaterThan(0);
  });
});
