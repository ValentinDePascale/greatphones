const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();

  p.on('response', resp => {
    if (resp.url().includes('/api/auth')) console.log('Auth:', resp.status(), resp.url().substring(resp.url().indexOf('/api/auth')));
  });

  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(1000);

  await p.evaluate(() => window.nav('login'));
  await p.waitForTimeout(1000);

  await p.locator('#loginEmail').fill('admin@greatphones.com.ar');
  await p.locator('#loginPassword').fill('admin123');
  await p.locator('#loginRemember').check();

  await p.locator('#p-login button:has-text("Iniciar sesión")').click();
  await p.waitForTimeout(4000);

  console.log('Final URL:', p.url());
  const actPage = await p.locator('.page.act');
  console.log('Active page id:', await actPage.getAttribute('id'));

  // Try to access admin
  await p.evaluate(() => window.nav('admin'));
  await p.waitForTimeout(2000);

  console.log('After admin nav URL:', p.url());
  const actPage2 = await p.locator('.page.act');
  console.log('Active page id after admin nav:', await actPage2.getAttribute('id'));

  const adminLayout = p.locator('#admin-layout');
  const adminDisplay = await adminLayout.evaluate(el => getComputedStyle(el).display);
  console.log('admin-layout display:', adminDisplay);

  await p.screenshot({ path: 'test-screenshots/after-login.png', fullPage: true });
  await b.close();
})();
