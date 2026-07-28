import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
const GIFT_CODE = 'GP-TEST-0003';
const EMAIL = 'testcoupon@gp.com';
const PASSWORD = 'test123';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getText(page, sel) {
  try {
    const el = page.locator(sel);
    return await el.isVisible({ timeout: 1000 }) ? await el.textContent() : '(not found)';
  } catch { return '(error)'; }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[CONSOLE ERROR]', msg.text());
  });

  // ======== 1. HOME ========
  console.log('\n=== 1. Loading home page ===');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await sleep(3000);
  await page.screenshot({ path: 'screenshots/01-home.png', fullPage: true });
  console.log('Title:', await page.title());

  // ======== 2. CLICK ACCOUNT (triggers login) ========
  console.log('\n=== 2. Clicking account button ===');
  const cuentaBtn = page.locator('button[nav="cuenta"], button[onclick="nav(\'cuenta\')"], button[aria-label="Mi Cuenta"]');
  await cuentaBtn.first().click();
  await sleep(1500);
  await page.screenshot({ path: 'screenshots/02-login-form.png', fullPage: true });

  // ======== 3. LOGIN ========
  console.log('\n=== 3. Logging in ===');
  const emailInput = page.locator('#loginEmail');
  const passInput = page.locator('#loginPassword');
  await emailInput.fill(EMAIL);
  await passInput.fill(PASSWORD);

  // Click the login submit button
  const loginSubmit = page.locator('button[onclick="doLogin()"]');
  await loginSubmit.click();
  await sleep(3000);
  await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });

  // Check if login succeeded (should be on home page with user logged in)
  const homeActive = await page.locator('#p-home.act, .page.act#p-home').isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Home active after login:', homeActive);

  // ======== 4. ACCOUNT PAGE ========
  console.log('\n=== 4. Opening account page ===');
  await cuentaBtn.first().click();
  await sleep(2000);
  await page.screenshot({ path: 'screenshots/04-cuenta.png', fullPage: true });

  const cuentaActive = await page.locator('#p-cuenta.act, .page.act#p-cuenta').isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Cuenta page active:', cuentaActive);

  // Log what's visible
  const bodyText = await page.locator('#p-cuenta').textContent().catch(() => '(no page content)');
    console.log('Cuenta page preview:', bodyText.substring(0, 300));

  // ======== 5. FIND REDEEM SECTION ========
  console.log('\n=== 5. Looking for redeem section ===');
  const redeemInput = page.locator('#redeemCodeInput');
  const inputVisible = await redeemInput.isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Redeem input visible:', inputVisible);

  if (inputVisible) {
    // Use evaluate to set value + trigger oninput events
    await page.evaluate(function(code) {
      var input = document.getElementById('redeemCodeInput');
      if (!input) return;
      var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(input, code);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, GIFT_CODE);
    await sleep(1000);

    const redeemBtn = page.locator('#redeemBtn');
    const btnEnabled = await redeemBtn.isEnabled().catch(() => false);
    console.log('Redeem button enabled:', btnEnabled);

    if (btnEnabled) {
      await redeemBtn.click();
      await sleep(3000);
    } else {
      console.log('Button still disabled, trying type() instead...');
      await redeemInput.clear();
      await redeemInput.type(GIFT_CODE, { delay: 50 });
      await sleep(1000);
      const btnEnabled2 = await redeemBtn.isEnabled().catch(() => false);
      console.log('Redeem button enabled after type:', btnEnabled2);
      if (btnEnabled2) {
        await redeemBtn.click();
        await sleep(3000);
      }
    }
    await page.screenshot({ path: 'screenshots/05-after-redeem.png', fullPage: true });

    // Check status message
    const statusEl = page.locator('#redeemStatus');
    const statusText = await statusEl.textContent().catch(() => '(not found)');
    console.log('Redeem status:', statusText);
    const statusClass = await statusEl.getAttribute('class').catch(() => '(no class)');
    console.log('Status class:', statusClass);
  } else {
    // Log the cuenta page HTML to understand render state
    const cuentaHTML = await page.locator('#p-cuenta').innerHTML().catch(() => '');
    console.log('Cuenta HTML preview:', cuentaHTML.substring(0, 1000));
  }

  // ======== 6. CHECK COUPONS VIA BROWSER FETCH ========
  console.log('\n=== 6. Checking coupons via browser fetch ===');
  const couponsResult = await page.evaluate(async (base) => {
    try {
      const res = await fetch(base + '/api/coupons');
      if (!res.ok) return { error: res.status + ' ' + res.statusText };
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  }, BASE);
  console.log('Coupons result:', JSON.stringify(couponsResult, null, 2));

  // ======== 7. CHECKOUT FLOW ========
  console.log('\n=== 7. Testing checkout flow ===');
  // Navigate to a product detail page directly
  const product = page.locator('.card, article, .prod-card, [class*="product"]').first();
  if (await product.isVisible({ timeout: 3000 }).catch(() => false)) {
    const link = product.locator('a').first();
    const href = await link.getAttribute('href').catch(() => null);
    if (href) {
      console.log('Product link:', href);
      await link.click();
      await sleep(2000);
      await page.screenshot({ path: 'screenshots/06-product.png', fullPage: true });
      
      // Try to add to cart
      const addBtn = page.locator('#detAddCart, button:has-text("Agregar"), button:has-text("Carrito")').first();
      if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addBtn.click();
        await sleep(1000);
        console.log('Added to cart');
        
        // Open checkout
        const checkoutNav = page.locator('button[onclick="nav(\'checkout\')"], button[aria-label="Checkout"]').first();
        if (await checkoutNav.isVisible({ timeout: 2000 }).catch(() => false)) {
          await checkoutNav.click();
          await sleep(3000);
          await page.screenshot({ path: 'screenshots/07-checkout.png', fullPage: true });
          
          const checkoutText = await page.locator('#p-checkout').textContent().catch(() => '');
          console.log('Checkout preview:', checkoutText.substring(0, 300));
        }
      }
    }
  } else {
    console.log('No product cards found on home');
  }

  await browser.close();
  console.log('\n=== DONE ===');
  console.log('Screenshots saved to screenshots/');
}

run().catch(e => {
  console.error('TEST FAILED:', e.message, e.stack);
  process.exit(1);
});
