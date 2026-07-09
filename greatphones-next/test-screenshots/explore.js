const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();

  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(2000);

  // Find which page is active
  const pages = await p.locator('[class*=page][class*=act]').all();
  for (let pg of pages) {
    const id = await pg.getAttribute('id');
    const cls = await pg.getAttribute('class');
    console.log('Active page:', id, '|', cls);
  }

  // Check all .page elements visibility
  const allPages = await p.locator('[id^=p-]').all();
  for (let pg of allPages) {
    const id = await pg.getAttribute('id');
    const display = await pg.evaluate(el => getComputedStyle(el).display);
    if (display !== 'none') console.log('Visible page:', id, 'display:', display);
  }

  // Try to find admin link
  const allLinks = await p.locator('a, button, [role=button]').all();
  for (let l of allLinks) {
    const t = await l.textContent();
    const id = await l.getAttribute('id');
    if ((t && (t.toLowerCase().includes('dashboard') || t.toLowerCase().includes('admin'))) || (id && id.includes('adm'))) {
      const cls = await l.getAttribute('class');
      const visible = await l.isVisible();
      console.log('Admin link found:', id || '', 'text:', (t || '').trim().substring(0, 50), 'visible:', visible, 'class:', (cls || '').substring(0, 60));
    }
  }

  // Check what's visible in the admin layout
  const adminLayout = await p.locator('#admin-layout');
  const adminDisplay = await adminLayout.evaluate(el => getComputedStyle(el).display);
  console.log('admin-layout display:', adminDisplay);

  const adminPanel = await p.locator('#adminPanel');
  const panelDisplay = await adminPanel.evaluate(el => getComputedStyle(el).display);
  console.log('adminPanel display:', panelDisplay);

  // Check the page that contains admin
  const pAdmin = await p.locator('#p-admin');
  const pAdminDisplay = await pAdmin.evaluate(el => getComputedStyle(el).display);
  console.log('#p-admin display:', pAdminDisplay);

  await b.close();
})();
