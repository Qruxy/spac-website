const { chromium } = require('playwright');

async function takeWebGLScreenshot() {
  console.log('Launching Playwright browser with WebGL support...');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1200 }
  });

  const page = await context.newPage();

  // Log any console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  try {
    console.log('Navigating to about page...');
    await page.goto('http://localhost:3000/about', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Waiting for page to fully load...');
    await page.waitForTimeout(10000);

    // Take viewport screenshot
    console.log('Taking viewport screenshot...');
    await page.screenshot({
      path: '/mnt/c/spac/playwright-full.png',
      timeout: 60000
    });

    // Scroll to Board of Directors section
    console.log('Scrolling to Board section...');
    await page.evaluate(() => {
      const boardSection = document.querySelector('h2');
      if (boardSection) {
        boardSection.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await page.waitForTimeout(2000);

    // Take screenshot of viewport
    await page.screenshot({
      path: '/mnt/c/spac/playwright-board.png',
      timeout: 60000
    });

    // Try to find the canvas element and screenshot it specifically
    const canvas = await page.$('canvas');
    if (canvas) {
      console.log('Found canvas element, taking canvas screenshot...');
      await canvas.screenshot({
        path: '/mnt/c/spac/playwright-canvas.png'
      });
    } else {
      console.log('No canvas element found');
    }

    // Check WebGL support
    const webglSupport = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    });
    console.log('WebGL supported:', webglSupport);

    // Check for any error boundary fallback
    const fallbackText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        if (el.textContent?.includes('3D content requires WebGL')) {
          return true;
        }
      }
      return false;
    });
    console.log('Showing WebGL fallback:', fallbackText);

    console.log('Screenshots saved!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

takeWebGLScreenshot();
