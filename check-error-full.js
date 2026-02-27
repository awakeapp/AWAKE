const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('goto /AWAKE/ramadan');
  await page.goto('http://localhost:5179/AWAKE/ramadan');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '.gemini/antigravity/brain/ramadan.png' });

  console.log('goto /AWAKE/ramadan/dhikr');
  await page.goto('http://localhost:5179/AWAKE/ramadan/dhikr');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '.gemini/antigravity/brain/dhikr.png' });

  console.log('goto /AWAKE/ramadan/stats');
  await page.goto('http://localhost:5179/AWAKE/ramadan/stats');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '.gemini/antigravity/brain/stats.png' });
  
  await browser.close();
})();
