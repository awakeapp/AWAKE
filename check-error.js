const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  console.log('goto /AWAKE/ramadan');
  await page.goto('http://localhost:5179/AWAKE/ramadan');
  await page.waitForTimeout(1000);
  console.log('goto /AWAKE/ramadan/dhikr');
  await page.goto('http://localhost:5179/AWAKE/ramadan/dhikr');
  await page.waitForTimeout(1000);
  console.log('goto /AWAKE/ramadan/stats');
  await page.goto('http://localhost:5179/AWAKE/ramadan/stats');
  await page.waitForTimeout(2000);
  await browser.close();
})();
