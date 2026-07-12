import { expect, test, type Page } from "@playwright/test";

const routes = [
  { path: "/", navName: "Home", heading: "Screen Recorder" },
  {
    path: "/studio",
    navName: "Studio",
    heading: "Live stage",
  },
  { path: "/recordings", navName: "Recordings", heading: "Recordings" },
] as const;

const footerRoutes = [
  {
    path: "/privacy",
    heading: "Privacy & Local Data",
  },
  { path: "/open-source", heading: "Open Source" },
] as const;

const githubUrl = "https://github.com/Rahul5g3d-official/screen_recorder";
const contactUrl = "mailto:Rahul5g3d.official@gmail.com";

async function expectRoute(page: Page, navName: string, heading: string) {
  await expect(page).toHaveURL(
    new RegExp(`${navName === "Home" ? "/" : `/${navName.toLowerCase()}`}$`),
  );
  await expect(
    page.getByRole("heading", { level: 1, name: heading, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", {
        name: navName,
        exact: true,
      }),
  ).toHaveAttribute("aria-current", "page");
}

async function expectFooterRoute(page: Page, path: string, heading: string) {
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(
    page.getByRole("heading", { level: 1, name: heading, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
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

  for (const route of footerRoutes) {
    test(`supports a direct deep link to ${route.path}`, async ({ page }) => {
      await page.goto(route.path);

      await expectFooterRoute(page, route.path, route.heading);
      await page.reload();
      await expectFooterRoute(page, route.path, route.heading);
    });
  }

  test("home calls to action and primary navigation preserve the browser flow", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: "Start Recording", exact: true })
      .click();
    await expectRoute(page, "Studio", "Live stage");

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

    await page
      .getByRole("link", { name: "View Recordings", exact: true })
      .click();
    await expectRoute(page, "Recordings", "Recordings");
  });

  test("unknown deep links safely return to Home", async ({ page }) => {
    await page.goto("/feature-that-does-not-exist");
    await expectRoute(page, "Home", "Screen Recorder");
  });

  test("footer navigation opens the completed information pages", async ({
    page,
  }) => {
    await page.goto("/");
    const footerNavigation = page.getByRole("navigation", {
      name: "Footer navigation",
    });

    await footerNavigation
      .getByRole("link", { name: "Privacy & Local Data", exact: true })
      .click();
    await expectFooterRoute(page, "/privacy", "Privacy & Local Data");
    await expect(page.getByRole("main")).toContainText(/not uploaded/i);

    await footerNavigation
      .getByRole("link", { name: "Open Source", exact: true })
      .click();
    await expectFooterRoute(page, "/open-source", "Open Source");

    const main = page.getByRole("main");
    await expect(main).toContainText(/open[- ]source.*platform/i);
    await expect(main.locator(`a[href="${githubUrl}"]`)).toBeVisible();
    await expect(main.locator(`a[href="${contactUrl}"]`)).toBeVisible();
  });
});
