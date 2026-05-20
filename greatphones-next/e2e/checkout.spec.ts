import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    await page.getByTestId('cart-badge').click();
    await expect(page.getByTestId('cart-overlay')).toBeVisible();
  });

  test('should display checkout page with all sections', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-page')).toBeVisible();
    await expect(page.getByTestId('checkout-email')).toBeVisible();
    await expect(page.getByTestId('checkout-phone')).toBeVisible();
    await expect(page.getByTestId('checkout-street')).toBeVisible();
    await expect(page.getByTestId('checkout-number')).toBeVisible();
    await expect(page.getByTestId('checkout-zip')).toBeVisible();
    await expect(page.getByTestId('checkout-city')).toBeVisible();
    await expect(page.getByTestId('checkout-province')).toBeVisible();
    await expect(page.getByTestId('checkout-document')).toBeVisible();
    await expect(page.getByTestId('checkout-items')).toBeVisible();
    await expect(page.getByTestId('checkout-subtotal')).toBeVisible();
    await expect(page.getByTestId('checkout-total')).toBeVisible();
    await expect(page.getByTestId('btn-continue-checkout')).toBeVisible();
  });

  test('should select warranty option', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByTestId('checkout-warranty').locator('div').nth(1).click();
    const warrantyBtn = page.getByTestId('checkout-warranty').locator('div').nth(1);
    await expect(warrantyBtn).toHaveCSS('border-color', 'rgb(45, 90, 39)');
  });

  test('should select delivery option', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByTestId('checkout-delivery').locator('div').nth(1).click();
    const deliveryBtn = page.getByTestId('checkout-delivery').locator('div').nth(1);
    await expect(deliveryBtn).toHaveCSS('border-color', 'rgb(45, 90, 39)');
  });

  test('should select cuotas option', async ({ page }) => {
    await page.goto('/checkout');
    await page.getByTestId('checkout-cuotas').getByText('3').click();
    const cuotaBtn = page.getByTestId('checkout-cuotas').getByText('3');
    await expect(cuotaBtn).toHaveCSS('background-color', 'rgb(45, 90, 39)');
  });

  test('should fill checkout form and open verification', async ({ page }) => {
    await page.goto('/checkout');
    
    await page.getByTestId('checkout-email').fill('test@example.com');
    await page.getByTestId('checkout-phone').fill('11 2345 6789');
    await page.getByTestId('checkout-street').fill('Av. Colon');
    await page.getByTestId('checkout-number').fill('1234');
    await page.getByTestId('checkout-zip').fill('8000');
    await page.getByTestId('checkout-city').fill('Bahia Blanca');
    await page.getByTestId('checkout-province').selectOption('Buenos Aires');
    await page.getByTestId('checkout-document').fill('20-12345678-9');
    
    await page.getByTestId('btn-continue-checkout').click();
    
    await expect(page.getByTestId('verification-modal')).toBeVisible();
  });

  test('should show payment methods in verification', async ({ page }) => {
    await page.goto('/checkout');
    
    await page.getByTestId('checkout-email').fill('test@example.com');
    await page.getByTestId('checkout-phone').fill('11 2345 6789');
    await page.getByTestId('checkout-street').fill('Av. Colon');
    await page.getByTestId('checkout-number').fill('1234');
    await page.getByTestId('checkout-zip').fill('8000');
    await page.getByTestId('checkout-city').fill('Bahia Blanca');
    await page.getByTestId('checkout-province').selectOption('Buenos Aires');
    await page.getByTestId('checkout-document').fill('20-12345678-9');
    
    await page.getByTestId('btn-continue-checkout').click();
    await expect(page.getByTestId('verification-modal')).toBeVisible();
    
    await page.getByTestId('btn-verify-pay').click();
    
    await expect(page.getByTestId('payment-mp')).toBeVisible();
    await expect(page.getByTestId('payment-tarjeta')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/checkout');
    
    await page.getByTestId('checkout-email').fill('');
    await page.getByTestId('checkout-street').fill('');
    await page.getByTestId('checkout-number').fill('');
    await page.getByTestId('checkout-zip').fill('');
    await page.getByTestId('checkout-city').fill('');
    await page.getByTestId('checkout-province').selectOption('');
    await page.getByTestId('checkout-document').fill('');
    
    await page.getByTestId('btn-continue-checkout').click();
    
    await expect(page.getByTestId('verification-modal')).not.toBeVisible();
  });
});
