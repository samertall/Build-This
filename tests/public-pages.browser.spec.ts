import { expect, test } from "@playwright/test";

test("privacy, terms, and support pages are accessible without authentication", async ({ page }) => {
  for (const [path, title] of [
    ["/privacy", "Privacy policy"],
    ["/terms", "Terms of use"],
    ["/support", "Help and support"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(title));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://app.samertall.com${path}`);
    await expect(page.getByRole("navigation", { name: "Legal and support" })).toBeVisible();
  }
});

test("legal pages stay readable from small mobile through desktop widths", async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [path, title] of [
      ["/privacy", "Privacy policy"],
      ["/terms", "Terms of use"],
      ["/support", "Help and support"],
    ]) {
      const errors: string[] = [];
      const onPageError = (error: Error) => errors.push(error.message);
      page.on("pageerror", onPageError);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${path} overflows at ${width}px`).toBe(false);
      expect(errors, `${path} has JavaScript errors at ${width}px`).toEqual([]);
      page.off("pageerror", onPageError);
    }
  }
});
