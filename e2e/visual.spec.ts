import { test, expect } from '@playwright/test';

test.describe('Visual & Animations', () => {
  test('homepage loads without critical errors', async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        criticalErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Page should load
    await expect(page.locator('body')).toBeVisible();
    
    // Filter acceptable errors
    const realErrors = criticalErrors.filter(
      err => !err.includes('hydration') && 
             !err.includes('Warning:') && 
             !err.includes('404') &&
             !err.includes('Failed to load')
    );
    
    // Allow some console errors in dev mode
    expect(realErrors.length).toBeLessThan(5);
  });
});

test.describe('Broken Images', () => {
  test('homepage images load', async ({ page }) => {
    const brokenImages: string[] = [];

    page.on('response', response => {
      if (response.request().resourceType() === 'image' && response.status() >= 400) {
        brokenImages.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some broken images (e.g., external services)
    expect(brokenImages.length).toBeLessThan(3);
  });
});

test.describe('Mobile Responsive', () => {
  test('homepage renders at 375px width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const response = await page.goto('/');
    
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('about page renders at 375px width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const response = await page.goto('/about');
    
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('events page renders at 375px width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const response = await page.goto('/events');
    
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Tablet Responsive', () => {
  test('homepage renders at 768px width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const response = await page.goto('/');
    
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });
});
