from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
PID = "cmsfe0dkj0000z0oalwq99vxe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
    page.wait_for_timeout(2500)

    # measure natural document Y of gallery
    nat = page.evaluate("() => { const r=document.querySelector('.det-gallery').getBoundingClientRect(); return window.scrollY + r.top; }")
    docH = page.evaluate("document.documentElement.scrollHeight")
    bodyH = page.evaluate("document.body.scrollHeight")
    print("natural Y:", round(nat,1), " docH:", docH, " bodyH:", bodyH)

    for sy in [0, 300, 600, 900, 1200]:
        page.evaluate(f"window.scrollTo(0,{sy})")
        page.wait_for_timeout(200)
        top = page.evaluate("document.querySelector('.det-gallery').getBoundingClientRect().top")
        print("scrollY", sy, "-> gallery rect.top", round(top,1))

    # check if any ancestor becomes scroll container
    sc = page.evaluate("""() => {
      const out=[];
      document.querySelectorAll('html,body,#main-content,.page.act,#p-detail,main').forEach(function(el){
        const s=getComputedStyle(el);
        out.push(el.tagName+'#'+(el.id||'')+' overflow='+s.overflowY+' clip='+s.overflowClipMargin);
      });
      return out;
    }""")
    print("\n".join(sc))
    browser.close()