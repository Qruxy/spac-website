const puppeteer = require('puppeteer');

async function screenshotBoard() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    console.log('Loading /about page on port 3000...');
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle0', timeout: 60000 });

    console.log('Scrolling to Board of Directors section...');
    await page.evaluate(() => {
      const boardSection = document.querySelector('#board');
      if (boardSection) {
        boardSection.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        window.scrollTo(0, 1600);
      }
    });

    console.log('Waiting for render...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('Taking screenshot...');
    await page.screenshot({ path: '/mnt/c/spac/board-cards.png' });

    console.log('Done! Check board-cards.png');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

screenshotBoard();
