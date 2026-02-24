import { test, expect } from '@playwright/test';

test.describe('Logout Page', () => {
  test('unauthenticated user visiting /logout sees confirmation page (not 404)', async ({ page }) => {
    const response = await page.goto('/logout');

    // Must not 404
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).toBeLessThan(400);

    // Wait for the page to settle (client component)
    await page.waitForLoadState('networkidle');

    // Should show the signed-out confirmation heading
    await expect(
      page.getByRole('heading', { name: /see you under the stars/i })
    ).toBeVisible();
  });

  test('/logout page contains "Sign back in" link pointing to /login', async ({ page }) => {
    await page.goto('/logout');
    await page.waitForLoadState('networkidle');

    const signInLink = page.getByRole('link', { name: /sign back in/i });
    await expect(signInLink).toBeVisible();

    const href = await signInLink.getAttribute('href');
    expect(href).toBe('/login');
  });

  test('/logout page contains "Go home" link pointing to /', async ({ page }) => {
    await page.goto('/logout');
    await page.waitForLoadState('networkidle');

    const homeLink = page.getByRole('link', { name: /go home/i });
    await expect(homeLink).toBeVisible();

    const href = await homeLink.getAttribute('href');
    expect(href).toBe('/');
  });

  test('/logout page renders within the auth card layout', async ({ page }) => {
    await page.goto('/logout');
    await page.waitForLoadState('networkidle');

    // Auth layout wraps content in a rounded card — check the card container exists
    const card = page.locator('.rounded-lg.border');
    await expect(card).toBeVisible();
  });
});
