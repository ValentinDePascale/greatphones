from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
PID = "cmsfe0dkj0000z0oalwq99vxe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
    page.wait_for_timeout(2500)

    def check(label):
        page.evaluate("window.scrollTo(0, 700)")
        page.wait_for_timeout(350)
        top = page.evaluate("document.querySelector('.det-gallery').getBoundingClientRect().top")
        print(label, "gallery top at scrollY700:", round(top, 1))

    check("with clip:")
    page.evaluate("document.body.style.overflowX='visible'")
    check("without clip:")
    page.evaluate("document.body.style.overflowX=''")
    page.evaluate("document.body.style.overflow=''")
    check("reset:")

    browser.close()