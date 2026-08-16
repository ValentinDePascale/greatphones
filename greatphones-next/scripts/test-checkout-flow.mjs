import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'testcoupon@gp.com';
const PASSWORD = 'test123';
const USER_ID = 'cms3zal100000b0oa333bx6wa';
const COUPON_ID = 'cms3zphbh0000ysoa2rm7vksc';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('socket.io') && !msg.text().includes('eval()')) {
      console.log('[BROWSER]', msg.type(), msg.text().substring(0, 150));
    }
  });

  // ======== 1. LOGIN ========
  console.log('=== 1. Login ===');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await sleep(2000);
  
  // Click account button to go to login
  await page.locator('button[aria-label="Mi Cuenta"]').click();
  await sleep(1500);

  // Fill login form
  await page.locator('#loginEmail').fill(EMAIL);
  await page.locator('#loginPassword').fill(PASSWORD);
  await page.locator('button[onclick="doLogin()"]').click();
  await sleep(3000);

  // ======== 2. VERIFY COUPON IN ACCOUNT ========
  console.log('\n=== 2. Check coupons in account ===');
  await page.locator('button[aria-label="Mi Cuenta"]').click();
  await sleep(2000);

  // Check coupon section shows 1 active
  const cuentaText = await page.locator('#p-cuenta').textContent().catch(() => '');
  const hasCupon = cuentaText.includes('cupón') || cuentaText.includes('Cupón');
  const hasGpTest = cuentaText.includes('GP-TEST-0003');
  console.log('Coupon text visible:', hasCupon);
  console.log('GP-TEST-0003 visible:', hasGpTest);
  console.log('Cuenta text snippet:', cuentaText.substring(cuentaText.indexOf('Cupón'), cuentaText.indexOf('Cupón') + 100).replace(/\s+/g, ' '));

  // ======== 3. SET CART + OPEN CHECKOUT ========
  console.log('\n=== 3. Setting cart and opening checkout ===');
  await page.evaluate(function(uid) {
    // Set cart with a product
    var cartKey = 'cart_' + uid;
    var cart = [{
      id: 'cmogbqv9e0003rsoa7cf00j0m',
      productId: 'cmogbqv9e0003rsoa7cf00j0m',
      qty: 1,
      name: 'Galaxy S24 Ultra',
      price: 1580000,
      imageUrl: ''
    }];
    try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch(e) {}
    // Also set the global cart variable
    if (typeof Cart !== 'undefined') {
      Cart.length = 0;
      Cart.push.apply(Cart, cart);
    }
  }, USER_ID);

  // Navigate to checkout via JS
  await page.evaluate(function() {
    if (typeof nav === 'function') nav('checkout');
  });
  await sleep(3000);
  await page.screenshot({ path: 'screenshots/10-checkout.png', fullPage: true });

  const checkoutText = await page.locator('#p-checkout').textContent().catch(() => '');
  console.log('Checkout loaded:', checkoutText.substring(0, 200).replace(/\s+/g, ' '));

  // ======== 4. CHECK COUPON CARD IN CHECKOUT ========
  console.log('\n=== 4. Checking coupon section in checkout ===');
  const hasCpnCard = checkoutText.includes('cupón') || checkoutText.includes('Cupón') || checkoutText.includes('Cupones');
  const hasCpnContainer = await page.locator('#cpnCheckoutCard').isVisible({ timeout: 2000 }).catch(() => false);
  console.log('Coupon text in checkout:', hasCpnCard);
  console.log('#cpnCheckoutCard visible:', hasCpnContainer);

  // ======== 5. FILL CHECKOUT STEP 1 (personal data) ========
  console.log('\n=== 5. Filling checkout step 1 ===');
  // The fields might auto-populate from user data, or might need manual fill
  const nameInput = page.locator('#checkoutName, input[name="name"], input[placeholder*="Nombre"]').first();
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Name input visible, filling data...');
    const emailInput = page.locator('#checkoutEmail, input[name="email"], input[placeholder*="Email"]').first();
    const phoneInput = page.locator('#checkoutPhone, input[name="phone"], input[placeholder*="Teléfono"]').first();
    
    if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      const val = await emailInput.inputValue().catch(() => '');
      if (!val) await emailInput.fill(EMAIL);
    }
    
    // Click "Continuar" or next step button
    const nextBtn = page.locator('button:has-text("Continuar"), button:has-text("Siguiente"), button:has-text("Seguir")').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click();
      await sleep(2000);
      await page.screenshot({ path: 'screenshots/11-checkout-step2.png', fullPage: true });
      console.log('Moved to step 2');
      
      // Step 2: Garantías (warranties) - just continue
      const nextBtn2 = page.locator('button:has-text("Continuar"), button:has-text("Siguiente")').first();
      if (await nextBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn2.click();
        await sleep(2000);
        await page.screenshot({ path: 'screenshots/12-checkout-step3.png', fullPage: true });
        console.log('Moved to step 3 (summary)');
        
        // Check summary for coupon discount line
        const step3Text = await page.locator('#p-checkout').textContent().catch(() => '');
        console.log('Step 3 coupon discount visible:', step3Text.includes('Descuento') || step3Text.includes('cupón'));
      }
    }
  } else {
    console.log('No name input visible, data might pre-fill from user profile');
    // Try to advance steps anyway
  }

  // ======== 6. VERIFY CHECKOUT COUPON API ========
  console.log('\n=== 6. Testing checkout API with coupon ===');
  // Use the browser's fetch context (session cookie)
  const apiResult = await page.evaluate(async function(base, couponId) {
    try {
      // First login via API to ensure session
      const loginRes = await fetch(base + '/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'testcoupon@gp.com', password: 'test123' })
      });
      const loginData = await loginRes.json();
      
      // Now try checkout with coupon
      const checkoutRes = await fetch(base + '/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testcoupon@gp.com',
          name: 'Test Coupon',
          phone: '123456789',
          provincia: 'Buenos Aires',
          ciudad: 'Bahia Blanca',
          direccion: 'Test 123',
          paymentMethod: 'coupons',
          coupons: [couponId],
          items: [{
            productId: 'cmogbqv9e0003rsoa7cf00j0m',
            qty: 1,
            price: 1580000
          }],
          total: 1580000
        })
      });
      const data = await checkoutRes.json();
      return { status: checkoutRes.status, data: data };
    } catch(e) {
      return { error: e.message };
    }
  }, BASE, COUPON_ID);
  console.log('Checkout API result:', JSON.stringify(apiResult, null, 2));

  await browser.close();
  console.log('\n=== DONE ===');
}

run().catch(e => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});
