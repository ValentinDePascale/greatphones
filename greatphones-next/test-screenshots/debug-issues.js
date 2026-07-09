const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const notFound = [];

  p.on('response', resp => {
    if (resp.status() === 404) notFound.push(resp.url());
  });

  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(1500);

  await p.evaluate(() => window.nav('login'));
  await p.waitForTimeout(1000);
  await p.locator('#loginEmail').fill('admin@greatphones.com.ar');
  await p.locator('#loginPassword').fill('admin123');
  await p.locator('#loginRemember').check();
  await p.locator('#p-login button:has-text("Iniciar sesión")').click();
  await p.waitForTimeout(3000);

  await p.evaluate(() => window.nav('admin'));
  await p.waitForTimeout(2000);

  // Check usuarios tab
  await p.evaluate(() => { const el = document.getElementById('adm-users'); if (el) el.click(); });
  await p.waitForTimeout(3000);
  const usersContent = await p.locator('#adminContent').textContent();
  console.log('=== USERS TAB ===');
  console.log('Content (first 500):', usersContent.substring(0, 500));

  // Check orders tab
  await p.evaluate(() => { const el = document.getElementById('adm-orders'); if (el) el.click(); });
  await p.waitForTimeout(3000);
  const ordersContent = await p.locator('#adminContent').textContent();
  console.log('\n=== ORDERS TAB ===');
  console.log('Content (first 500):', ordersContent.substring(0, 500));

  // Check instore tab
  await p.evaluate(() => { const el = document.getElementById('adm-instore'); if (el) el.click(); });
  await p.waitForTimeout(3000);
  const instoreContent = await p.locator('#adminContent').textContent();
  console.log('\n=== INSTORE TAB ===');
  console.log('Content (first 500):', instoreContent.substring(0, 500));

  console.log('\n=== 404 RESOURCES ===');
  notFound.forEach(url => {
    const path = url.substring(url.indexOf(':3000') + 6);
    console.log('  ' + path);
  });

  await b.close();
})();
