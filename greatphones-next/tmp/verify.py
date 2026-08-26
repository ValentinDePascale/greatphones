from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # HOME mobile: categorias deslizables + catnav scroll
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(f"{BASE}/", wait_until="networkidle")
    page.wait_for_timeout(1200)
    home = page.evaluate("""() => {
      const catScroll = document.querySelector('.cat-scroll');
      const catFlex = document.querySelector('.cat-flex');
      const navInner = document.querySelector('.catnav-inner');
      return {
        catOverflow: catScroll ? getComputedStyle(catScroll).overflowX : null,
        catWrap: catFlex ? getComputedStyle(catFlex).flexWrap : null,
        catScrollable: catScroll ? catScroll.scrollWidth > catScroll.clientWidth : null,
        catScrollW: catScroll ? catScroll.scrollWidth : null,
        catClientW: catScroll ? catScroll.clientWidth : null,
        navInnerJc: navInner ? getComputedStyle(navInner).justifyContent : null,
        navInnerWidth: navInner ? getComputedStyle(navInner).width : null,
        cardWidth: (() => { const c = document.querySelector('.cat-card'); return c ? getComputedStyle(c).flex : null; })(),
        hamburgers: document.querySelectorAll('.admin-hamburger').length,
      };
    }""")
    print("HOME 390:", home)
    page.close()

    # ADMIN: no admin-hamburger, topbar title present
    page2 = browser.new_page(viewport={"width": 1440, "height": 900})
    page2.goto(f"{BASE}/admin", wait_until="networkidle")
    page2.wait_for_timeout(1500)
    admin = page2.evaluate("""() => ({
      hamburgerBtns: document.querySelectorAll('.admin-hamburger').length,
      topbarTitle: document.querySelector('#adminPageTitle') ? document.querySelector('#adminPageTitle').textContent : null,
      mobileBar: document.querySelector('.admin-mobile-bar') ? getComputedStyle(document.querySelector('.admin-mobile-bar')).display : 'none',
      sidebarCount: document.querySelectorAll('.admin-sidebar').length,
    })""")
    print("ADMIN desktop:", admin)
    page2.close()
    browser.close()