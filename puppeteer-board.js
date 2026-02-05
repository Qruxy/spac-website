const puppeteer = require('puppeteer');

async function takeScreenshot() {
  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1200 });

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('MeshLine')) {
      console.log('Error:', msg.text());
    }
  });

  try {
    console.log('Loading page...');
    await page.goto('http://localhost:3000/about', { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Waiting for render...');
    await new Promise(r => setTimeout(r, 8000));

    console.log('Taking full page screenshot...');
    await page.screenshot({ path: '/mnt/c/spac/board-section.png', fullPage: true });

    console.log('Done! Check board-section.png');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
