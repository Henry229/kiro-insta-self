import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Next.js/);
});

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Expect the page to load successfully
  await expect(page.locator('body')).toBeVisible();
});
