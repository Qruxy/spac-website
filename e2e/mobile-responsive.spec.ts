import { test, expect, Page } from '@playwright/test';

// Viewport configurations
const viewports = [
  { name: '320px (small phone)', width: 320, height: 568 },
  { name: '375px (iPhone SE)', width: 375, height: 667 },
  { name: '414px (iPhone Plus)', width: 414, height: 896 },
  { name: '768px (tablet portrait)', width: 768, height: 1024 },
  { name: '1024px (tablet landscape)', width: 1024, height: 768 },
  { name: '1280px (laptop)', width: 1280, height: 800 },
  { name: '1920px (desktop)', width: 1920, height: 1080 },
];

// Pages to test
const pages = [
  { path: '/', name: 'Homepage' },
  { path: '/about', name: 'About' },
  { path: '/events', name: 'Events' },
  { path: '/gallery', name: 'Gallery' },
  { path: '/donations', name: 'Donations' },
  { path: '/newsletter', name: 'Newsletter' },
  { path: '/obs', name: 'OBS' },
  { path: '/mirror-lab', name: 'Mirror Lab' },
  { path: '/history', name: 'History' },
  { path: '/classifieds', name: 'Classifieds' },
  { path: '/contact', name: 'Contact' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
];

interface ResponsiveIssue {
  page: string;
  viewport: string;
  issue: string;
  details?: string;
}

const issues: ResponsiveIssue[] = [];

async function checkForOverflow(page: Page, pageName: string, viewportName: string) {
  const overflow = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const hasHorizontalScroll = body.scrollWidth > body.clientWidth || html.scrollWidth > html.clientWidth;
    
    // Find elements causing overflow
    const overflowingElements: string[] = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        const tagName = el.tagName.toLowerCase();
        const className = el.className || '';
        const id = el.id || '';
        overflowingElements.push(`${tagName}${id ? '#' + id : ''}${className ? '.' + className.split(' ').join('.') : ''}`);
      }
    });
    
    return {
      hasHorizontalScroll,
      bodyWidth: body.scrollWidth,
      viewportWidth: window.innerWidth,
      overflowAmount: body.scrollWidth - body.clientWidth,
      overflowingElements: overflowingElements.slice(0, 5), // Limit to first 5
    };
  });
  
  return overflow;
}

async function checkTapTargets(page: Page) {
  const smallTargets = await page.evaluate(() => {
    const targets: string[] = [];
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
    
    interactiveElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      // 44x44px is the recommended minimum tap target size
      if (rect.width < 44 || rect.height < 44) {
        const tagName = el.tagName.toLowerCase();
        const text = (el as HTMLElement).innerText?.slice(0, 30) || '';
        targets.push(`${tagName}: "${text}" (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
      }
    });
    
    return targets.slice(0, 10); // Limit to first 10
  });
  
  return smallTargets;
}

async function checkTextReadability(page: Page) {
  const readabilityIssues = await page.evaluate(() => {
    const issues: string[] = [];
    const textElements = document.querySelectorAll('p, span, li, td, th, label');
    
    textElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      
      // Text smaller than 12px is hard to read on mobile
      if (fontSize < 12 && (el as HTMLElement).innerText?.trim()) {
        issues.push(`Font size ${fontSize}px: "${(el as HTMLElement).innerText?.slice(0, 30)}"`);
      }
    });
    
    return issues.slice(0, 5);
  });
  
  return readabilityIssues;
}

test.describe('Mobile Responsiveness Tests', () => {
  for (const viewport of viewports) {
    test.describe(`Viewport: ${viewport.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const pageConfig of pages) {
        test(`${pageConfig.name} (${pageConfig.path})`, async ({ page }) => {
          // Navigate to the page
          const response = await page.goto(`http://localhost:3001${pageConfig.path}`, {
            waitUntil: 'networkidle',
            timeout: 30000,
          });
          
          // Check page loaded successfully
          if (!response || response.status() >= 400) {
            console.log(`⚠️ ${pageConfig.name}: Page returned ${response?.status()}`);
            return;
          }
          
          // Wait for content to render
          await page.waitForTimeout(1000);
          
          // Check for horizontal overflow
          const overflow = await checkForOverflow(page, pageConfig.name, viewport.name);
          if (overflow.hasHorizontalScroll) {
            console.log(`❌ OVERFLOW on ${pageConfig.name} at ${viewport.name}:`);
            console.log(`   Body width: ${overflow.bodyWidth}px vs Viewport: ${overflow.viewportWidth}px`);
            console.log(`   Overflow: ${overflow.overflowAmount}px`);
            if (overflow.overflowingElements.length > 0) {
              console.log(`   Elements: ${overflow.overflowingElements.join(', ')}`);
            }
            expect(overflow.hasHorizontalScroll).toBe(false);
          }
          
          // Check tap targets on mobile viewports
          if (viewport.width < 768) {
            const smallTargets = await checkTapTargets(page);
            if (smallTargets.length > 0) {
              console.log(`⚠️ Small tap targets on ${pageConfig.name} at ${viewport.name}:`);
              smallTargets.forEach(t => console.log(`   ${t}`));
            }
          }
          
          // Check text readability
          const readabilityIssues = await checkTextReadability(page);
          if (readabilityIssues.length > 0) {
            console.log(`⚠️ Small text on ${pageConfig.name} at ${viewport.name}:`);
            readabilityIssues.forEach(i => console.log(`   ${i}`));
          }
          
          // Take screenshot for visual verification
          await page.screenshot({
            path: `test-results/mobile/${viewport.width}px-${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}.png`,
            fullPage: true,
          });
        });
      }
    });
  }
});

test.describe('Mobile Navigation Tests', () => {
  test('Mobile menu appears on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    
    // Check for mobile navigation dock
    const mobileNav = page.locator('nav');
    await expect(mobileNav).toBeVisible();
  });
  
  test('Navigation links are accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    
    // Check that nav links work
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
