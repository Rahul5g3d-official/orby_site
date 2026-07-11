import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));

  expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

test("the core visual flow stays inside desktop and mobile viewports", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Screen Recorder" })).toBeVisible();
  await expectNoHorizontalPageOverflow(page);

  await page.getByRole("link", { name: "Start Recording", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Record your tab, camera, and voice" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live stage", exact: true })).toBeVisible();
  await expectNoHorizontalPageOverflow(page);

  await page.getByRole("button", { name: /Studio setup/ }).click();
  const dialog = page.getByRole("dialog", { name: "Studio setup" });
  const dialogBox = await dialog.boundingBox();
  const viewport = page.viewportSize();

  expect(dialogBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (dialogBox && viewport) {
    expect(dialogBox.x).toBeGreaterThanOrEqual(-1);
    expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(dialogBox.y).toBeGreaterThanOrEqual(-1);
    expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height + 1);
  }
  await expectNoHorizontalPageOverflow(page);

  await dialog.getByRole("link", { name: "Layout", exact: true }).click();
  await expect(page).toHaveURL(/\/studio#setup-layout$/);
  await expect(dialog.getByRole("heading", { name: "Choose the composition", exact: true })).toBeVisible();
  await dialog.getByRole("link", { name: "Voice", exact: true }).click();
  await expect(page).toHaveURL(/\/studio#setup-voice$/);
  await expect(dialog.getByRole("heading", { name: "Choose and test your sound", exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Recordings", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Recordings", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh", exact: true })).toBeVisible();
  await expectNoHorizontalPageOverflow(page);
});
