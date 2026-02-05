import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('homepage loads with all sections', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section - main heading exists
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check navigation
    await expect(page.getByRole('navigation').first()).toBeVisible();
    
    // Check footer
    await expect(page.locator('footer')).toBeVisible();
    
    // Check some key sections exist
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('about page loads', async ({ page }) => {
    const response = await page.goto('/about');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Main content should be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('events page loads', async ({ page }) => {
    const response = await page.goto('/events');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should show events or empty state
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('gallery page loads', async ({ page }) => {
    const response = await page.goto('/gallery');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('classifieds page loads', async ({ page }) => {
    const response = await page.goto('/classifieds');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should show listings or empty state
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });

  test('VSA page loads', async ({ page }) => {
    const response = await page.goto('/vsa');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('donations page loads', async ({ page }) => {
    const response = await page.goto('/donations');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('newsletter page loads', async ({ page }) => {
    const response = await page.goto('/newsletter');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('mirror lab page loads', async ({ page }) => {
    const response = await page.goto('/mirror-lab');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('history page loads', async ({ page }) => {
    const response = await page.goto('/history');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('OBS page loads', async ({ page }) => {
    const response = await page.goto('/obs');
    
    // Page should load successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Should have main content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('SEO & Meta', () => {
  test('homepage has proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title exists
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('Page Error Handling', () => {
  test('no 500 errors on public pages', async ({ page }) => {
    const pages = [
      '/',
      '/about',
      '/events',
      '/gallery',
      '/classifieds',
      '/vsa',
      '/donations',
      '/newsletter',
      '/mirror-lab',
      '/history',
      '/obs',
    ];

    for (const url of pages) {
      const response = await page.goto(url);
      expect(response?.status(), `Page ${url} failed`).toBeLessThan(500);
    }
  });
});
