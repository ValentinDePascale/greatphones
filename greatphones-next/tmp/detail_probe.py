from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
PID = "cmsfe0dkj0000z0oalwq99vxe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
    page.wait_for_timeout(2500)

    # Check which badges are present
    pills = page.locator(".det-pill").all_inner_texts()
    print("PILLS:", pills)

    # check detDesc presence
    print("detDesc present:", page.locator("#detDesc").count())

    # Get computed styles of gallery and main image
    gal = page.evaluate("""() => {
      const g = document.querySelector('.det-gallery');
      const img = document.querySelector('.det-main-img');
      const cs = getComputedStyle(g);
      const ics = getComputedStyle(img);
      const rect = g.getBoundingClientRect();
      return {
        gallerySticky: cs.position,
        galleryTop: cs.top,
        galleryHeight: rect.height,
        imgHeight: img.getBoundingClientRect().height,
        imgPadding: ics.padding,
        overflowBody: getComputedStyle(document.body).overflowX
      };
    }""")
    print("GALLERY:", gal)

    # Scroll and re-measure gallery top to confirm sticky pinning
    page.evaluate("window.scrollTo(0, 300)")
    page.wait_for_timeout(600)
    top1 = page.evaluate("document.querySelector('.det-gallery').getBoundingClientRect().top")
    page.evaluate("window.scrollTo(0, 900)")
    page.wait_for_timeout(600)
    top2 = page.evaluate("document.querySelector('.det-gallery').getBoundingClientRect().top")
    print("STICKY top@300:", top1, "top@900:", top2)

    # Button box
    btn = page.locator("#detAddCart").bounding_box()
    print("ADD CART BOX:", btn)

    # sp-card size
    sc = page.evaluate("""() => {
      const c = document.querySelector('.sp-card');
      if(!c) return 'no sp-card';
      const r = c.getBoundingClientRect();
      return { w: r.width, h: r.height, pad: getComputedStyle(c).padding };
    }""")
    print("SP-CARD:", sc)

    title = page.evaluate("""() => {
      const t = document.querySelector('.det-section-title');
      if(!t) return 'none';
      return getComputedStyle(t).fontSize;
    }""")
    print("SECTION TITLE FONT:", title)

    # related image
    ri = page.locator(".det-related-img").first.bounding_box()
    rii = page.evaluate("""() => {
      const img = document.querySelector('.det-related-img img');
      if(!img) return 'no img';
      return { w: img.clientWidth, h: img.clientHeight, objFit: getComputedStyle(img).objectFit };
    }""")
    print("RELATED IMG BOX:", ri, "IMG:", rii)

    browser.close()