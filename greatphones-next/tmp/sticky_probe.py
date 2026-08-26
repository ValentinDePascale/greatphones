from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
PID = "cmsfe0dkj0000z0oalwq99vxe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
    page.wait_for_timeout(2500)

    res = page.evaluate("""() => {
      const g = document.querySelector('.det-gallery');
      const chain = [];
      let el = g;
      while (el) {
        const cs = getComputedStyle(el);
        chain.push({
          tag: el.tagName,
          id: el.id,
          cls: (el.className||'').toString().slice(0,40),
          pos: cs.position,
          transform: cs.transform,
          overflow: cs.overflowX + '/' + cs.overflowY,
          willChange: cs.willChange,
          contain: cs.contain
        });
        el = el.parentElement;
      }
      return chain;
    }""")
    for c in res:
        print(c)
    browser.close()