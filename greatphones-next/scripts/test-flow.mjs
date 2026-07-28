import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const BASE = 'http://localhost:3000';
const GIFT_CODE = 'GP-TEST-0003';
const EMAIL = 'admin@greatphones.com';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER ERROR]', msg.text());
  });

  // ---- Step 1: Go to home page ----
  console.log('1. Navigating to home...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await sleep(2000);
  console.log('   Title:', await page.title());

  // ---- Step 2: Try to log in ----
  console.log('2. Logging in...');
  // Find and click login button (common patterns)
  const loginBtn = page.locator('button:has-text("Ingresar"), a:has-text("Ingresar"), button:has-text("Iniciar"), a:has-text("Iniciar")').first();
  if (await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await loginBtn.click();
    await sleep(2000);
    
    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput = page.locator('input[type="password"], input[name="password"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(EMAIL);
      if (await passInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passInput.fill('admin123');
      }
      const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Ingresar")').first();
      await submitBtn.click();
      await sleep(3000);
      console.log('   Login submitted');
    }
  } else {
    console.log('   No login button found, checking if already logged in...');
  }

  // Take screenshot of current state
  await page.screenshot({ path: 'screenshots/01-home.png', fullPage: true }).catch(() => {});

  // ---- Step 3: Navigate to account/cuenta section ----
  console.log('3. Opening account section...');
  const cuentaLink = page.locator('a:has-text("Cuenta"), button:has-text("Cuenta"), a:has-text("Mi cuenta")').first();
  if (await cuentaLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cuentaLink.click();
    await sleep(3000);
    await page.screenshot({ path: 'screenshots/02-cuenta.png', fullPage: true }).catch(() => {});
    console.log('   Account page opened');
    
    // Check content
    const pageContent = await page.content();
    const hasCouponSection = pageContent.includes('cupon') || pageContent.includes('Cupon');
    const hasRedeemSection = pageContent.includes('Canjeá') || pageContent.includes('canje');
    console.log('   Has coupon section:', hasCouponSection);
    console.log('   Has redeem section:', hasRedeemSection);
  } else {
    console.log('   No account link found, trying navigation menu...');
  }

  // ---- Step 4: Try to redeem gift card ----
  console.log('4. Testing gift card redeem...');
  
  // Look for the redeem input and button
  const redeemInput = page.locator('input[placeholder*="codigo" i], input[placeholder*="código" i], input[placeholder*="gift" i]').first();
  if (await redeemInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await redeemInput.fill(GIFT_CODE);
    const redeemBtn = page.locator('button:has-text("Canjeá"), button:has-text("Canjear"), button:has-text("Canje"), button:has-text("Redeem")').first();
    if (await redeemBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await redeemBtn.click();
      await sleep(3000);
      await page.screenshot({ path: 'screenshots/03-after-redeem.png', fullPage: true }).catch(() => {});
      console.log('   Redeem submitted');
      
      // Check for success message
      const afterContent = await page.content();
      const hasSuccess = afterContent.includes('cupón') || afterContent.includes('Cupón') || afterContent.includes('éxito') || afterContent.includes('Exito');
      console.log('   Redeem success msg visible:', hasSuccess);
    }
  } else {
    console.log('   No redeem input found, checking DOM...');
    // Dump section content for debugging
    const body = await page.locator('body').innerHTML();
    const relevant = body.substring(0, 3000);
    console.log('   Body preview:', relevant.substring(0, 500));
  }

  // ---- Step 5: Try checkout flow ----
  console.log('5. Testing checkout flow...');
  
  // First add a product to cart
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await sleep(2000);
  
  const productLink = page.locator('a:has-text("Ver más"), a:has-text("Comprar"), a.card, article a').first();
  if (await productLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await productLink.click();
    await sleep(2000);
    console.log('   Product page opened');
    
    const addBtn = page.locator('button:has-text("Agregar"), button:has-text("Comprar"), button:has-text("Añadir")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await sleep(2000);
      console.log('   Added to cart');
      
      // Go to checkout
      const checkoutBtn = page.locator('a:has-text("Checkout"), a:has-text("Finalizar"), button:has-text("Checkout"), button:has-text("Finalizar")').first();
      if (await checkoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await checkoutBtn.click();
        await sleep(3000);
        await page.screenshot({ path: 'screenshots/04-checkout.png', fullPage: true }).catch(() => {});
        console.log('   Checkout page opened');
      }
    }
  }

  await browser.close();
  console.log('Done - screenshots saved to screenshots/');
}

run().catch(e => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});
