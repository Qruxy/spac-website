const puppeteer = require('puppeteer');

async function screenshotLanyard() {
  console.log('Launching browser...');
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
  await page.setViewport({ width: 1400, height: 900 });

  try {
    console.log('Loading /about page on port 3000...');
    await page.goto('http://localhost:3000/about', { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Waiting for page to load (8 seconds)...');
    await new Promise(r => setTimeout(r, 8000));

    // Scroll to the Board section
    console.log('Scrolling to Board of Directors section...');
    await page.evaluate(() => {
      const boardSection = document.querySelector('#board');
      if (boardSection) {
        boardSection.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        window.scrollTo(0, 1600);
      }
    });

    console.log('Waiting for 3D content to render (15 seconds)...');
    await new Promise(r => setTimeout(r, 15000));

    // Take screenshot
    console.log('Taking screenshot of Board section...');
    await page.screenshot({ path: '/mnt/c/spac/lanyard-test.png' });

    console.log('Done! Check lanyard-test.png');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

screenshotLanyard();
