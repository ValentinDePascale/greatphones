from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
PID = "cmsfe0dkj0000z0oalwq99vxe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
    page.wait_for_timeout(2500)

    # Which element is the actual scrolling element?
    scout = page.evaluate("""() => {
      const el = document.querySelector('.det-gallery');
      let n = 0;
      let cur = el;
      while(cur && n < 12){ n++; cur = cur.parentElement; }
      // find nearest scrollable ancestor
      cur = el.parentElement;
      const res=[];
      while(cur && res.length<12){
        const s = getComputedStyle(cur);
        const ro = s.overflowY;
        const canScroll = (cur.scrollHeight > cur.clientHeight + 1);
        res.push((cur.tagName)+'#'+(cur.id||'')+'.'+(typeof cur.className==='string'?cur.className.slice(0,25):'')+' ov='+ro+' canScroll='+canScroll+' sh='+cur.scrollHeight+' ch='+cur.clientHeight);
        cur = cur.parentElement;
      }
      return res;
    }""")
    print("\n".join(scout))

    # Try removing overflow-x clip on html and body
    res = page.evaluate("""() => {
      const g = document.querySelector('.det-gallery');
      const r1 = g.getBoundingClientRect().top;
      window.scrollTo(0, 500);
      const r2 = g.getBoundingClientRect().top;
      return {before: Math.round(r1), after: Math.round(r2)};
    }""")
    print(res)
    page.evaluate("document.documentElement.style.overflowX='clip';document.body.style.overflowX='clip';document.documentElement.style.overflow='clip';document.body.style.overflow='clip'")
    page.evaluate("window.scrollTo(0,500)")
    page.wait_for_timeout(200)
    res = page.evaluate("() => document.querySelector('.det-gallery').getBoundingClientRect().top")
    print("after forcing clip on html/body, top at 500:", round(res,1))

    browser.close()