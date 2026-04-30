import { test, expect } from "@playwright/test";
import { fixtureHashUrl, loadFixture, toStandardBase64, toUrlSafeBase64 } from "./fixtures/make-hash";

test.describe("hash loader", () => {
  test("URL-safe #data_b64 boots viewer without ever showing loader", async ({ page }) => {
    const fixture = loadFixture("canonical") as { title: string };
    await page.goto(fixtureHashUrl("canonical", true));
    await expect(page.locator("#app")).toContainText(fixture.title);
    // pasteBox is the loader; should not be in the DOM after a successful boot
    await expect(page.locator("#pasteBox")).toHaveCount(0);
  });

  test("standard base64 (with + / =) is also accepted", async ({ page }) => {
    const fixture = loadFixture("canonical") as { title: string };
    const json = JSON.stringify(fixture);
    const b64 = toStandardBase64(json);
    // Encode reserved chars so the URL itself is well-formed
    await page.goto(`/#data_b64=${encodeURIComponent(b64)}`);
    await expect(page.locator("#app")).toContainText(fixture.title);
  });

  test("multi-param hash still loads", async ({ page }) => {
    const fixture = loadFixture("canonical") as { title: string };
    const b64 = toUrlSafeBase64(JSON.stringify(fixture));
    await page.goto(`/#foo=bar&data_b64=${b64}`);
    await expect(page.locator("#app")).toContainText(fixture.title);
  });

  test("malformed payload → loader + readable error", async ({ page }) => {
    await page.goto("/#data_b64=zzzzzNotValidBase64$$$$");
    await expect(page.locator("#pasteBox")).toBeVisible();
    await expect(page.locator("#err")).toHaveClass(/show/);
    await expect(page.locator("#err")).toContainText(/Could not load document from URL/);
  });

  test("payload missing 'claims' array → readable error", async ({ page }) => {
    const bad = toUrlSafeBase64(JSON.stringify({ title: "No claims here" }));
    await page.goto(`/#data_b64=${bad}`);
    await expect(page.locator("#pasteBox")).toBeVisible();
    await expect(page.locator("#err")).toContainText(/claims/i);
  });

  test("'Load different document' clears the hash and refresh stays on loader", async ({ page }) => {
    await page.goto(fixtureHashUrl("canonical"));
    await expect(page.locator("#pasteBox")).toHaveCount(0);
    await page.locator("#reloadBtn").click();
    await expect(page.locator("#pasteBox")).toBeVisible();
    expect(page.url()).not.toContain("#data_b64");
    await page.reload();
    await expect(page.locator("#pasteBox")).toBeVisible();
  });
});
