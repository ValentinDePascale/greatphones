from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:3000"
PID = "cmsfe0dkj0000z0oalwq99vxe"
OUT = r"C:\Users\valen\OneDrive\Documentos\Programacion\greatphones\greatphones-next\tmp"

def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
        page.wait_for_timeout(2500)
        page.screenshot(path=f"{OUT}/detail-desktop-top.png")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1200)
        page.screenshot(path=f"{OUT}/detail-desktop-bottom.png")

        # desktop with scroll mid to check sticky image
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(800)
        page.screenshot(path=f"{OUT}/detail-desktop-scroll600.png")

        # mobile
        page2 = browser.new_page(viewport={"width": 390, "height": 844})
        page2.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
        page2.wait_for_timeout(2500)
        page2.screenshot(path=f"{OUT}/detail-mobile-top.png")
        page2.evaluate("window.scrollTo(0, 700)")
        page2.wait_for_timeout(800)
        page2.screenshot(path=f"{OUT}/detail-mobile-scroll.png")
        page2.screenshot(path=f"{OUT}/detail-mobile-full.png", full_page=True)

        browser.close()

main()
print("done")