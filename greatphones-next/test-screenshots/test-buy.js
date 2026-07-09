const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();

  // Collect errors
  const errors = [];
  p.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  p.on('pageerror', err => errors.push(err.message));

  // Load home page
  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(2000);
  console.log('=== HOME LOADED ===');
  console.log('Errors:', errors.length);

  // Find first "Agregar al carrito" or "Comprar ahora" on home page
  const buyBtns = await p.locator('button:has-text("Comprar ahora"), button:has-text("Agregar al carrito")').all();
  let clicked = 0;
  for (let btn of buyBtns) {
    if (await btn.isVisible()) {
      const text = await btn.textContent();
      console.log(`Clicking: "${text.trim().substring(0,30)}"`);
      await btn.click();
      await p.waitForTimeout(1500);
      clicked++;

      // Check cart badge
      const badge = p.locator('#cartBadge, [data-testid=cart-badge]').first();
      if (await badge.isVisible()) {
        const badgeText = await badge.textContent();
        console.log('Cart badge:', badgeText.trim());
      }

      // Check if cart overlay appeared
      const cartOverlay = p.locator('#cartOverlay, [data-testid=cart-overlay]').first();
      if (await cartOverlay.isVisible()) {
        const cartDisplay = await cartOverlay.evaluate(el => getComputedStyle(el).display);
        console.log('Cart overlay display:', cartDisplay);
      }

      // Check for toasts
      const toast = p.locator('.toast, [class*=toast], [class*=Toast]').first();
      if (await toast.isVisible()) {
        const toastText = await toast.textContent();
        console.log('Toast:', toastText.trim().substring(0, 50));
      }

      break;
    }
  }

  if (clicked === 0) {
    console.log('No buy buttons found on home page');
    // Try navigating to shop page to find products
    const shopLink = p.locator('a[href*="shop"], button:has-text("Catálogo"), button:has-text("Ver catalogo")').first();
    if (await shopLink.isVisible()) {
      await shopLink.click();
      await p.waitForTimeout(2000);
      console.log('Navigated to shop');

      // Find product cards
      const cards = await p.locator('.product-card, [class*=product], .prod-card, [class*=prod]').all();
      console.log('Product cards found:', cards.length);

      // Click first product
      const firstCardLink = cards[0] || p.locator('button:has-text("Ver variantes")').first();
      if (await firstCardLink.isVisible()) {
        await firstCardLink.click();
        await p.waitForTimeout(2000);
        console.log('Clicked product card');
      }
    }
  }

  // Check for errors on checkout page
  const checkoutLink = p.locator('button:has-text("Comprar ahora")').first();
  if (await checkoutLink.isVisible()) {
    await checkoutLink.click();
    await p.waitForTimeout(2000);

    const checkoutPage = p.locator('#p-checkout');
    const checkoutDisplay = await checkoutPage.evaluate(el => getComputedStyle(el).display);
    console.log('Checkout page display:', checkoutDisplay);

    // Check for cart items in checkout
    const items = p.locator('#checkout-items, [data-testid=checkout-items]').first();
    if (await items.isVisible()) {
      const itemText = await items.textContent();
      console.log('Checkout items:', itemText.trim().substring(0, 100));
    }
  }

  console.log('\n=== FINAL ERRORS ===');
  errors.forEach(e => console.log(e.substring(0, 200)));

  await b.close();
})();
