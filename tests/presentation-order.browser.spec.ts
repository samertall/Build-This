import { expect, test } from "@playwright/test";

const presentationFixture = {
  id: 701,
  projectId: 42,
  title: "Ordering Regression Deck",
  presentationType: "ux-review",
  audience: "stakeholders",
  slideCount: 2,
  status: "ready",
  createdAt: "2026-09-03T00:00:00.000Z",
  slides: [
    {
      id: 1,
      title: "Authored sections",
      layout: "overview",
      content: {
        zeta: "Z",
        headline: "H",
        alpha: "A",
      },
      sectionOrder: ["headline", "zeta"],
    },
    {
      id: 2,
      title: "Legacy sections",
      layout: "overview",
      content: {
        zeta: "Z",
        headline: "H",
        alpha: "A",
      },
    },
  ],
};

test("keeps authored and legacy section labels in presentation order", async ({ page }) => {
  let listRequests = 0;
  await page.route("**/api/projects/42/presentations", async (route) => {
    listRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([presentationFixture]),
    });
  });

  await page.goto("/projects/42/presentations");
  await expect(page.getByRole("heading", { name: "Presentations" })).toBeVisible();
  await page.getByRole("button", { name: "View Stakeholder Deck" }).click();
  await expect(page.getByRole("heading", { name: "Ordering Regression Deck" })).toBeVisible();

  await expect(page.getByTestId("presentation-section-label")).toHaveText([
    "Headline",
    "Zeta",
    "Alpha",
    "Alpha",
    "Headline",
    "Zeta",
  ]);
  expect(listRequests).toBe(1);
});