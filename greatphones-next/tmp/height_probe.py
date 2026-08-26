from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
PID = "cmsfe0dkj0000z0oalwq99vxe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
    page.wait_for_timeout(2500)
    r = page.evaluate("""() => {
      const g = document.querySelector('.det-gallery').getBoundingClientRect();
      const info = document.querySelector('.det-info').getBoundingClientRect();
      const img = document.querySelector('.det-main-img').getBoundingClientRect();
      const thumbs = document.querySelector('.det-thumbnails') ? document.querySelector('.det-thumbnails').getBoundingClientRect() : null;
      return {
        galleryH: Math.round(g.height),
        infoH: Math.round(info.height),
        mainImgH: Math.round(img.height),
        thumbsH: thumbs ? Math.round(thumbs.height) : 0,
        gridTop: Math.round(g.top)
      };
    }""")
    print(r)
    browser.close()