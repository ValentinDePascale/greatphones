const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errors = [];

  p.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text().substring(0, 200));
  });
  p.on('pageerror', err => errors.push(err.message.substring(0, 200)));

  // ============ 1. LOGIN ============
  console.log('=== LOGIN ===');
  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(1000);
  await p.evaluate(() => window.nav('login'));
  await p.waitForTimeout(1000);
  await p.locator('#loginEmail').fill('admin@greatphones.com.ar');
  await p.locator('#loginPassword').fill('admin123');
  await p.locator('#loginRemember').check();
  await p.locator('#p-login button:has-text("Iniciar sesión")').click();
  await p.waitForTimeout(3000);

  // Navigate to admin
  await p.evaluate(() => window.nav('admin'));
  await p.waitForTimeout(2000);
  console.log('Admin page active:', await p.locator('#p-admin.page.act').count() > 0);

  // ============ 2. TEST ADMIN SIDEBAR TABS ============
  console.log('\n=== SIDEBAR TABS ===');
  const sidebarTabs = [
    'adm-dashboard',
    'adm-prods',
    'adm-acc',
    'adm-stock',
    'adm-promos',
    'adm-orders',
    'adm-arrep',
    'adm-users',
    'adm-chat',
    'adm-quotes',
    'adm-instore',
  ];

  for (let tabId of sidebarTabs) {
    const el = p.locator(`#${tabId}`);
    const count = await el.count();
    const visible = count > 0 && await el.first().isVisible();
    if (visible) {
      const txt = await el.first().textContent();
      console.log(`  ${tabId}: clickable | ${(txt || '').trim().substring(0, 40)}`);
    } else if (count > 0) {
      console.log(`  ${tabId}: exists but hidden`);
    } else {
      console.log(`  ${tabId}: NOT FOUND in DOM`);
    }
  }

  // ============ 3. TEST PRODUCTS TAB (adminContent area) ============
  console.log('\n=== PRODUCTS TAB ===');
  let admProds = p.locator('#adm-prods');
  if (await admProds.count() > 0) {
    // Click via JavaScript since it might need special handling
    await p.evaluate(() => {
      const el = document.getElementById('adm-prods');
      if (el) el.click();
    });
    await p.waitForTimeout(2000);

    // Check what's in adminContent
    const content = p.locator('#adminContent');
    if (await content.count() > 0) {
      const text = await content.textContent();
      console.log('  Admin content loaded:', text.length > 50 ? 'YES (' + text.length + ' chars)' : text.substring(0, 100));
    }

    // Check for "Agregar producto" button
    const addBtns = p.locator('button:has-text("Agregar producto")');
    console.log('  Agregar producto btn count:', await addBtns.count());
    if (await addBtns.count() > 0) {
      console.log('  Agregar producto visible:', await addBtns.first().isVisible());
    }

    // Check for product edit/delete buttons
    const editBtns = p.locator('button:has-text("Editar")');
    const delBtns = p.locator('button:has-text("Eliminar")');
    console.log('  Edit btns:', await editBtns.count(), ' Delete btns:', await delBtns.count());

    // Screenshot products
    await p.screenshot({ path: 'test-screenshots/admin-productos.png', fullPage: true });
  }

  // ============ 4. TEST CHAT ============
  console.log('\n=== CHAT TAB ===');
  await p.evaluate(() => { const el = document.getElementById('adm-chat'); if (el) el.click(); });
  await p.waitForTimeout(2000);

  // Check chat elements - use first() for duplicates (old + new admin)
  for (let sel of ['#adminChatInput', '#adminSendBtn', '#adminProductBtn', '#chatMsgList', '.chat-conv-side']) {
    const el = p.locator(sel).first();
    const countAll = await p.locator(sel).count();
    console.log(`  ${sel}: count=${countAll} visible=${countAll > 0 ? await el.isVisible() : 'N/A'}`);
  }

  // Check what type adminChatInput is (should be textarea after fix) - use first()
  const chatInputEl = p.locator('#adminChatInput').first();
  const count = await p.locator('#adminChatInput').count();
  console.log('  adminChatInput count:', count);
  const tag = await chatInputEl.evaluate(el => el.tagName);
  console.log('  adminChatInput tag:', tag, '(expect TEXTAREA)');
  // Check if the visible one is in adminContent
  const inContent = await p.locator('#adminContent #adminChatInput').count();
  console.log('  adminChatInput in #adminContent:', inContent);

  await p.screenshot({ path: 'test-screenshots/admin-chat.png', fullPage: true });

  // ============ 5. TEST DASHBOARD ============
  console.log('\n=== DASHBOARD ===');
  await p.evaluate(() => { const el = document.getElementById('adm-dashboard'); if (el) el.click(); });
  await p.waitForTimeout(2000);
  const dashContent = await p.locator('#adminContent').textContent();
  console.log('  Dashboard content length:', dashContent.length);
  // Check for key dashboard metrics
  for (let kw of ['total', 'venta', 'producto', 'usuario', 'pedido', 'ingreso']) {
    if (dashContent.toLowerCase().includes(kw)) console.log(`  Contains "${kw}": YES`);
  }
  await p.screenshot({ path: 'test-screenshots/admin-dashboard.png', fullPage: true });

  // ============ 6. TEST OTHER TABS ============
  console.log('\n=== OTHER TABS ===');
  for (let tabId of ['adm-orders', 'adm-users', 'adm-quotes', 'adm-instore']) {
    await p.evaluate((id) => { const el = document.getElementById(id); if (el) el.click(); }, tabId);
    await p.waitForTimeout(2000);

    const content = p.locator('#adminContent');
    const text = await content.textContent();
    console.log(`  ${tabId}: content length=${text.length}`);

    // Check for toasts/errors
    const toasts = await p.locator('.toast, .toast-container > *').all();
    for (let t of toasts) {
      if (await t.isVisible()) {
        const txt = await t.textContent();
        if (txt) console.log(`    TOAST: ${txt.trim().substring(0, 80)}`);
      }
    }

    await p.screenshot({ path: `test-screenshots/admin-${tabId}.png`, fullPage: true });
  }

  // ============ 7. TEST BUY FLOW ============
  console.log('\n=== BUY FLOW ===');
  // Go to home
  await p.evaluate(() => window.nav('home'));
  await p.waitForTimeout(2000);

  // Find a product with "Comprar ahora" button
  const buyBtn = p.locator('#detBuyNow');
  const buyBtnCount = await buyBtn.count();
  console.log('detBuyNow count:', buyBtnCount);

  if (buyBtnCount > 0 && await buyBtn.isVisible()) {
    await buyBtn.click();
    await p.waitForTimeout(3000);

    // Check if navigated to checkout
    const checkout = p.locator('#p-checkout');
    const checkoutDisplay = await checkout.evaluate(el => getComputedStyle(el).display);
    console.log('Checkout display:', checkoutDisplay);

    // Check if cart has items
    const items = p.locator('#checkout-items');
    if (await items.count() > 0) {
      const itemText = await items.textContent();
      const hasItems = itemText.length > 50 && !itemText.includes('No hay productos');
      console.log('Cart has items:', hasItems);
      if (!hasItems) console.log('  Items content:', itemText.substring(0, 100));
    }

    await p.screenshot({ path: 'test-screenshots/checkout.png', fullPage: true });
  } else {
    console.log('  No buy button visible on home page');
    // Try to find a product and go to its detail
    const verBtns = p.locator('button:has-text("Ver variantes"), a:has-text("Ver iPhone")');
    if (await verBtns.count() > 0 && await verBtns.first().isVisible()) {
      await verBtns.first().click();
      await p.waitForTimeout(2000);
      console.log('  Clicked variant button');

      const detBuyNow = p.locator('#detBuyNow');
      if (await detBuyNow.isVisible()) {
        await detBuyNow.click();
        await p.waitForTimeout(3000);
        console.log('  Clicked Comprar ahora from detail');
      }
    }
  }

  // ============ REPORT ============
  console.log(`\n=== REPORT ===`);
  console.log(`Total console errors: ${errors.length}`);
  errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

  await b.close();
})();
