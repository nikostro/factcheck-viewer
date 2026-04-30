import { test, expect } from "@playwright/test";
import { loadFixture } from "./fixtures/make-hash";

test.describe("smoke / loader", () => {
  test("cold open shows the loader", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#pasteBox")).toBeVisible();
    await expect(page.locator("#dropZone")).toBeVisible();
    await expect(page.locator("#loadBtn")).toBeEnabled();
    await expect(page.locator("#err")).not.toHaveClass(/show/);
  });

  test("Example document button populates the textarea", async ({ page }) => {
    await page.goto("/");
    const before = await page.locator("#pasteBox").inputValue();
    expect(before).toBe("");
    await page.locator("#exampleBtn").click();
    const after = await page.locator("#pasteBox").inputValue();
    expect(after.length).toBeGreaterThan(0);
    expect(after).toContain('"title"');
  });

  test("paste valid JSON and load → viewer renders title and claim", async ({ page }) => {
    await page.goto("/");
    const fixture = loadFixture("canonical") as { title: string; claims: { id: string }[] };
    await page.locator("#pasteBox").fill(JSON.stringify(fixture));
    await page.locator("#loadBtn").click();
    await expect(page.locator("#app")).toContainText(fixture.title);
    await expect(page.locator(`[data-open-claim="${fixture.claims[0].id}"]`)).toBeVisible();
  });

  test("paste invalid JSON → error is shown, viewer not booted", async ({ page }) => {
    await page.goto("/");
    await page.locator("#pasteBox").fill("{ not json");
    await page.locator("#loadBtn").click();
    await expect(page.locator("#err")).toHaveClass(/show/);
    await expect(page.locator("#err")).not.toBeEmpty();
    await expect(page.locator("#pasteBox")).toBeVisible();
  });

  test("empty paste → load button surfaces an error rather than booting", async ({ page }) => {
    await page.goto("/");
    await page.locator("#pasteBox").fill("");
    await page.locator("#loadBtn").click();
    await expect(page.locator("#err")).toHaveClass(/show/);
  });
});
