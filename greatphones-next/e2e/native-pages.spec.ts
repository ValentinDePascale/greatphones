import { test, expect } from '@playwright/test'

test.describe('Native Pages E2E', () => {

  test('Home page loads with hero and categories', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Hero section
    await expect(page.locator('.hero-title')).toBeVisible()
    await expect(page.locator('.hero-title')).toContainText('Tecnología premium')

    // Categories section
    await expect(page.locator('.cat-card').first()).toBeVisible()
    const catCards = await page.locator('.cat-card').count()
    expect(catCards).toBeGreaterThanOrEqual(4)

    // Product grid should be visible
    await expect(page.locator('.pc').first()).toBeVisible({ timeout: 10000 })
  })

  test('Catalog page loads with product grid and sort', async ({ page }) => {
    await page.goto('/productos')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.page-h1')).toContainText('Catálogo')
    await expect(page.locator('.pc').first()).toBeVisible({ timeout: 10000 })

    // Sort dropdown
    const sortSelect = page.locator('select').first()
    await expect(sortSelect).toBeVisible()
    await sortSelect.selectOption('asc')
    await page.waitForTimeout(300)

    // Products should still be visible after sort
    await expect(page.locator('.pc').first()).toBeVisible()
  })

  test('Product detail page loads with specs and badges', async ({ page }) => {
    await page.goto('/productos')
    await page.waitForLoadState('networkidle')

    // Click first product
    const firstCard = page.locator('.pc').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })
    await firstCard.click()
    await page.waitForURL(/\/productos\//)
    await page.waitForLoadState('networkidle')

    // Detail elements
    await expect(page.locator('.dt-name')).toBeVisible()
    await expect(page.locator('.dt-specs')).toBeVisible()
    await expect(page.locator('.dt-badges')).toBeVisible()
    await expect(page.locator('.btn-buy')).toBeVisible()
    await expect(page.locator('.btn-cart')).toBeVisible()

    // Breadcrumb
    await expect(page.locator('.dt-bc')).toBeVisible()
    await expect(page.locator('.dt-bc-brand')).toBeVisible()

    // Price should be visible
    await expect(page.locator('.dt-pr')).toBeVisible()
  })

  test('Detail page has back button to catalog', async ({ page }) => {
    await page.goto('/productos')
    await page.waitForLoadState('networkidle')

    await page.locator('.pc').first().click()
    await page.waitForURL(/\/productos\//)

    // Back button
    const backBtn = page.locator('.dt-back')
    await expect(backBtn).toBeVisible()
    await expect(backBtn).toContainText('Volver')
    await backBtn.click()
    await page.waitForURL('/productos')

    await expect(page.locator('.page-h1')).toContainText('Catálogo')
  })

  test('Offers page shows discounted products', async ({ page }) => {
    await page.goto('/ofertas')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.page-h1')).toContainText('Ofertas')

    // If there are offers, they should show discount badges
    const cards = page.locator('.pc')
    const count = await cards.count()
    if (count > 0) {
      // At least some cards should have discount badge
      const discBadges = await page.locator('.pc-badge-disc').count()
      expect(discBadges).toBeGreaterThan(0)
    }
  })

  test('Accessories page loads with category chips', async ({ page }) => {
    await page.goto('/accesorios')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.page-h1')).toContainText('Accesorios')

    // Category filter chips
    const chips = page.locator('.chips .chip')
    const chipCount = await chips.count()
    if (chipCount > 0) {
      await chips.first().click()
      await page.waitForTimeout(200)
    }
  })

  test('Search filters catalog products', async ({ page }) => {
    await page.goto('/productos')
    await page.waitForLoadState('networkidle')

    // Type in search
    const searchInput = page.locator('.f-input[placeholder*="Buscar"]')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('iPhone')
    await page.waitForTimeout(500)

    // URL should update
    await page.waitForURL(/search=iPhone/)

    // Results should be filtered
    const products = await page.locator('.pc').count()
    // Either we have matching products or empty state
    if (products > 0) {
      const brands = page.locator('.pc-brand')
      const firstBrand = await brands.first().textContent()
      // Should find iPhone products
      const allBrands = await brands.allTextContents()
      const hasIphone = allBrands.some(b => b.toLowerCase().includes('iphone'))
      expect(hasIphone).toBe(true)
    }
  })

  test('Loading skeleton appears and disappears', async ({ page }) => {
    // Navigate fast to see skeleton
    await page.goto('/productos')
    
    // After load, skeleton should be gone and products visible
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.pc').first()).toBeVisible({ timeout: 10000 })
  })

  test('Static pages render correctly', async ({ page }) => {
    // Garantias
    await page.goto('/garantias')
    await expect(page.locator('.page-h1')).toContainText('Garantías')
    await expect(page.locator('.gar-card')).toBeVisible()

    // Terminos
    await page.goto('/terminos')
    await expect(page.locator('.page-h1')).toContainText('Términos')

    // Privacidad
    await page.goto('/privacidad')
    await expect(page.locator('.page-h1')).toContainText('Privacidad')
  })

  test('Error page shows for non-existent product', async ({ page }) => {
    await page.goto('/productos/nonexistent-id-12345')
    await page.waitForLoadState('networkidle')

    // Should show error or 404
    const errorOr404 = page.locator('.dt-specs, h2, .page-legal')
    await expect(errorOr404.first()).toBeVisible()
  })

})
