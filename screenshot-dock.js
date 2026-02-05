const puppeteer = require('puppeteer');

async function screenshotDock() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    console.log('Loading homepage on port 3001...');
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Waiting for render...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: '/mnt/c/spac/dock-nav.png' });

    console.log('Done! Check dock-nav.png');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

screenshotDock();
