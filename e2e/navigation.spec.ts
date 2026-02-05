import { test, expect } from '@playwright/test';

test.describe('Header Navigation', () => {
  test('navigation bar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test('can navigate to events page', async ({ page }) => {
    await page.goto('/');
    
    // Click events link
    await page.getByRole('link', { name: /events/i }).first().click();
    await expect(page).toHaveURL(/\/events/);
  });

  test('can navigate to gallery page', async ({ page }) => {
    await page.goto('/');
    
    // Click gallery link
    await page.getByRole('link', { name: /gallery/i }).first().click();
    await expect(page).toHaveURL(/\/gallery/);
  });

  test('logo links to homepage', async ({ page }) => {
    await page.goto('/about');
    
    // Find and click logo/home link - look for SPAC text link
    const logoLink = page.getByRole('link', { name: /spac/i }).first();
    await logoLink.click();
    
    await expect(page).toHaveURL('/');
  });
});

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('mobile page loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    
    // Page should be visible
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Footer Links', () => {
  test('footer is visible', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('footer contains links', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const footer = page.locator('footer');
    
    // Check for links in footer
    const footerLinks = footer.locator('a');
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Internal Link Validation', () => {
  test('homepage internal links work', async ({ page }) => {
    await page.goto('/');
    
    // Check a few key internal links
    const testLinks = ['/events', '/gallery', '/about'];
    
    for (const href of testLinks) {
      const response = await page.goto(href);
      expect(response?.status(), `Link ${href} failed`).toBeLessThan(400);
    }
  });
});
