import { expect, test, type Page } from "@playwright/test";

const routes = [
  { path: "/", navName: "Home", heading: "Screen Recorder" },
  { path: "/studio", navName: "Studio", heading: "Record your tab, camera, and voice" },
  { path: "/recordings", navName: "Recordings", heading: "Recordings" },
] as const;

async function expectRoute(page: Page, navName: string, heading: string) {
  await expect(page).toHaveURL(new RegExp(`${navName === "Home" ? "/" : `/${navName.toLowerCase()}`}$`));
  await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", {
      name: navName,
      exact: true,
    }),
  ).toHaveAttribute("aria-current", "page");
}

test.describe("application routes", () => {
  for (const route of routes) {
    test(`supports a direct deep link to ${route.path}`, async ({ page }) => {
      await page.goto(route.path);

      await expectRoute(page, route.navName, route.heading);
      await page.reload();
      await expectRoute(page, route.navName, route.heading);
    });
  }

  test("home calls to action and primary navigation preserve the browser flow", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start Recording", exact: true }).click();
    await expectRoute(page, "Studio", "Record your tab, camera, and voice");

    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Recordings", exact: true })
      .click();
    await expectRoute(page, "Recordings", "Recordings");

    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Home", exact: true })
      .click();
    await expectRoute(page, "Home", "Screen Recorder");

    await page.getByRole("link", { name: "View Recordings", exact: true }).click();
    await expectRoute(page, "Recordings", "Recordings");
  });

  test("unknown deep links safely return to Home", async ({ page }) => {
    await page.goto("/feature-that-does-not-exist");
    await expectRoute(page, "Home", "Screen Recorder");
  });
});
