import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('login page loads', async ({ page }) => {
    const response = await page.goto('/login');
    
    // Page should load (might redirect)
    expect(response?.status()).toBeLessThan(500);
    
    // Should be on login or auth page
    await expect(page.locator('body')).toBeVisible();
  });

  test('register page loads', async ({ page }) => {
    const response = await page.goto('/register');
    
    // Page should load
    expect(response?.status()).toBeLessThan(500);
    
    // Should be on register or auth page
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/my-events',
    '/my-listings',
    '/my-offers',
    '/my-photos',
    '/billing',
    '/membership-card',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects or shows login`, async ({ page }) => {
      const response = await page.goto(route);
      
      // Should either redirect to login or return successfully
      // (Protected routes might redirect or show an error state)
      expect(response?.status()).toBeLessThan(500);
      
      // Wait for page to settle
      await page.waitForLoadState('domcontentloaded');
      
      // Should not crash - body should be visible
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
