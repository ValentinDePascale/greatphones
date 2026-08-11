from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    
    # 1. Check edit-profile visibility
    ep = page.locator('#p-edit-profile')
    if ep.count() > 0:
        display = ep.evaluate('el => window.getComputedStyle(el).display')
        print(f'1. edit-profile display: {display}')
        style = ep.get_attribute('style') or ''
        print(f'   inline style: {style[:100]}')
        print(f'   has page class: {"page" in (ep.get_attribute("class") or "")}')
    else:
        print('1. edit-profile NOT IN DOM')
    
    # 2. Check navRedirect exists
    has_fn = page.evaluate('() => typeof navRedirect === "function"')
    print(f'2. navRedirect exists: {has_fn}')
    
    # 3. Check if product grid loads
    products = page.locator('#p-home')
    if products.count() > 0:
        print(f'3. #p-home found: YES')
        print(f'   display: {products.evaluate("el => window.getComputedStyle(el).display")}')
    
    # 4. Navigate to /productos via URL, then check shop
    page.goto('http://localhost:3000/productos')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    
    shop = page.locator('#p-shop')
    if shop.count() > 0:
        print(f'4. /productos - #p-shop display: {shop.evaluate("el => window.getComputedStyle(el).display")}')
    
    ofertas = page.locator('#p-ofertas')
    print(f'5. /productos - #p-ofertas in DOM: {ofertas.count() > 0}')
    
    # Click "Ofertas" in catnav
    ofertas_btn = page.locator('#cn-ofertas')
    if ofertas_btn.count() > 0:
        page.evaluate('() => { if(typeof navRedirect==="function"){ navRedirect("ofertas"); } else { window.location.href="/ofertas"; } }')
        page.wait_for_timeout(500)
        print(f'6. After navRedirect: {page.url}')
    
    page.screenshot(path='debug_screenshot.png', full_page=True)
    print('7. Screenshot saved: debug_screenshot.png')
    
    browser.close()
