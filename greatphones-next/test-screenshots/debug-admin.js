const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();

  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(1500);

  // Login
  await p.evaluate(() => window.nav('login'));
  await p.waitForTimeout(1000);
  await p.locator('#loginEmail').fill('admin@greatphones.com.ar');
  await p.locator('#loginPassword').fill('admin123');
  await p.locator('#loginRemember').check();
  await p.locator('#p-login button:has-text("Iniciar sesión")').click();
  await p.waitForTimeout(3000);

  console.log('Login done, URL:', p.url());

  // Navigate to admin
  await p.evaluate(() => window.nav('admin'));
  await p.waitForTimeout(3000);
  console.log('Admin nav done, URL:', p.url());

  // Inspect active page and admin containers
  const activePages = await p.locator('[class*="page"][class*="act"]').all();
  for (let pg of activePages) {
    const id = await pg.getAttribute('id');
    const cls = await pg.getAttribute('class');
    console.log('Active page:', id, cls);
  }

  // Check admin-layout
  const adminLayout = p.locator('#admin-layout');
  const exists = await adminLayout.count();
  console.log('#admin-layout count:', exists);

  if (exists > 0) {
    const display = await adminLayout.evaluate(el => getComputedStyle(el).display);
    const parentDisplay = await adminLayout.evaluate(el => getComputedStyle(el.parentElement).display);
    console.log('#admin-layout display:', display, 'parent display:', parentDisplay);
    const parentId = await adminLayout.evaluate(el => el.parentElement.id);
    console.log('Parent id:', parentId);
    const parentClass = await adminLayout.evaluate(el => el.parentElement.className);
    console.log('Parent class:', parentClass);
  }

  // Check if the admin is inside a different container
  const adminSections = await p.locator('[id^="p-admin"], [class*="p-admin"], .admin-section').all();
  for (let s of adminSections) {
    const id = await s.getAttribute('id');
    const cls = await s.getAttribute('class');
    const display = await s.evaluate(el => getComputedStyle(el).display);
    console.log('Admin container:', id, cls, 'display:', display);
  }

  // Check all page containers with "admin" in id
  const allPages = await p.locator('[id*="admin"]').all();
  for (let pg of allPages) {
    const id = await pg.getAttribute('id');
    const display = await pg.evaluate(el => getComputedStyle(el).display);
    console.log('Element with admin in id:', id, 'display:', display);
  }

  // Check admin sidebar visibility
  const sidebar = p.locator('#admin-sidebar');
  console.log('sidebar count:', await sidebar.count());
  if (await sidebar.count() > 0) {
    console.log('sidebar display:', await sidebar.evaluate(el => getComputedStyle(el).display));
  }

  await p.screenshot({ path: 'test-screenshots/admin-page.png', fullPage: true });
  await b.close();
})();
