const { chromium } = require('playwright');

const viewports = [
  { name: '320px-mobile', width: 320, height: 568 },
  { name: '375px-iphone', width: 375, height: 667 },
  { name: '768px-tablet', width: 768, height: 1024 },
  { name: '1280px-laptop', width: 1280, height: 800 },
];

const pages = [
  { path: '/', name: 'homepage' },
  { path: '/about', name: 'about' },
  { path: '/events', name: 'events' },
  { path: '/gallery', name: 'gallery' },
  { path: '/donations', name: 'donations' },
  { path: '/obs', name: 'obs' },
  { path: '/mirror-lab', name: 'mirror-lab' },
  { path: '/history', name: 'history' },
  { path: '/classifieds', name: 'classifieds' },
];

const issues = [];

async function checkPage(page, pageConfig, viewport) {
  const pageIssues = [];
  
  try {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto(`http://localhost:3000${pageConfig.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    
    if (!response || response.status() >= 400) {
      pageIssues.push(`Page returned status ${response?.status()}`);
      return pageIssues;
    }
    
    await page.waitForTimeout(500);
    
    // Check for horizontal overflow
    const overflow = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const hasHorizontalScroll = body.scrollWidth > body.clientWidth + 1;
      
      return {
        hasHorizontalScroll,
        bodyWidth: body.scrollWidth,
        viewportWidth: window.innerWidth,
        overflow: body.scrollWidth - body.clientWidth,
      };
    });
    
    if (overflow.hasHorizontalScroll) {
      pageIssues.push(`HORIZONTAL OVERFLOW: ${overflow.overflow}px (body: ${overflow.bodyWidth}px, viewport: ${overflow.viewportWidth}px)`);
    }
    
    // Check for small tap targets on mobile
    if (viewport.width < 768) {
      const smallTargets = await page.evaluate(() => {
        const targets = [];
        const els = document.querySelectorAll('a, button, input, select, [role="button"]');
        
        els.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            const text = (el.innerText || el.value || '').slice(0, 20).trim();
            if (text) {
              targets.push(`${el.tagName}: "${text}" (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
            }
          }
        });
        
        return targets.slice(0, 5);
      });
      
      if (smallTargets.length > 0) {
        pageIssues.push(`Small tap targets: ${smallTargets.join(', ')}`);
      }
    }
    
    // Check for tiny text
    const smallText = await page.evaluate(() => {
      const issues = [];
      const els = document.querySelectorAll('p, span, li, a');
      
      els.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        
        if (fontSize < 12 && el.innerText?.trim()) {
          issues.push(`${fontSize}px: "${el.innerText.slice(0, 20).trim()}"`);
        }
      });
      
      return issues.slice(0, 3);
    });
    
    if (smallText.length > 0) {
      pageIssues.push(`Small text: ${smallText.join(', ')}`);
    }
    
    // Take screenshot
    await page.screenshot({
      path: `test-results/mobile/${viewport.name}-${pageConfig.name}.png`,
      fullPage: true,
    });
    
  } catch (err) {
    pageIssues.push(`Error: ${err.message}`);
  }
  
  return pageIssues;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('='.repeat(60));
  console.log('MOBILE RESPONSIVENESS TEST RESULTS');
  console.log('='.repeat(60));
  
  for (const viewport of viewports) {
    console.log(`\n## Viewport: ${viewport.name}`);
    console.log('-'.repeat(40));
    
    for (const pageConfig of pages) {
      const pageIssues = await checkPage(page, pageConfig, viewport);
      
      if (pageIssues.length > 0) {
        console.log(`\n❌ ${pageConfig.name} (${pageConfig.path}):`);
        pageIssues.forEach(issue => console.log(`   - ${issue}`));
        issues.push({ page: pageConfig.name, viewport: viewport.name, issues: pageIssues });
      } else {
        console.log(`✅ ${pageConfig.name}`);
      }
    }
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  if (issues.length === 0) {
    console.log('\n🎉 No responsive issues found!');
  } else {
    console.log(`\n⚠️ Found issues on ${issues.length} page/viewport combinations:`);
    issues.forEach(i => {
      console.log(`\n${i.viewport} - ${i.page}:`);
      i.issues.forEach(issue => console.log(`  - ${issue}`));
    });
  }
  
  // Output as JSON for parsing
  console.log('\n\nJSON_RESULTS:');
  console.log(JSON.stringify(issues, null, 2));
}

main().catch(console.error);
