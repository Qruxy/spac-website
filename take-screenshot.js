const puppeteer = require('puppeteer');

async function takeScreenshot() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1200 });

    console.log('Navigating to about page...');
    await page.goto('http://localhost:3000/about', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for page to fully load
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Take initial screenshot
    console.log('Taking initial screenshot...');
    await page.screenshot({
      path: '/mnt/c/spac/debug-screenshot-1.png',
      fullPage: true
    });

    // Scroll down to Board of Directors section
    console.log('Scrolling to Board section...');
    await page.evaluate(() => {
      window.scrollTo(0, 1200);
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot of scrolled view
    console.log('Taking Board section screenshot...');
    await page.screenshot({
      path: '/mnt/c/spac/debug-screenshot-2.png'
    });

    // Try to find canvas elements
    const canvases = await page.$$('canvas');
    console.log(`Found ${canvases.length} canvas elements`);

    if (canvases.length > 0) {
      for (let i = 0; i < canvases.length; i++) {
        try {
          await canvases[i].screenshot({ path: `/mnt/c/spac/debug-canvas-${i}.png` });
          console.log(`Canvas ${i} screenshot saved`);
        } catch (e) {
          console.log(`Canvas ${i} screenshot failed: ${e.message}`);
        }
      }
    }

    console.log('Screenshots saved successfully!');
    console.log('Files: debug-screenshot-1.png, debug-screenshot-2.png');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
