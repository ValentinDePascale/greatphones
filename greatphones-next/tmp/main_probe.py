from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
PID = "cmsfe0dkj0000z0oalwq99vxe"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/productos/{PID}", wait_until="networkidle")
    page.wait_for_timeout(2500)
    res = page.evaluate("""() => {
      const out=[];
      document.querySelectorAll('main').forEach(function(m){
        const s=getComputedStyle(m);
        out.push('<'+m.tagName.toLowerCase()+' class="'+(m.className||'')+'" id="'+(m.id||'')+'"> ov='+s.overflowY+' maxh='+s.maxHeight+' h='+(m.clientHeight)+' scrollh='+m.scrollHeight);
      });
      return out;
    }""")
    print("\n".join(res))

    # find which stylesheet sets it
    css = page.evaluate("""() => {
      const res=[];
      for(const sheet of document.styleSheets){
        let rules;
        try{ rules = sheet.cssRules; }catch(e){ continue; }
        if(!rules) continue;
        for(const r of rules){
          if(r.selectorText && /^main\b/.test(r.selectorText)){
            res.push(r.selectorText + ' :: ' + r.style.cssText);
          }
        }
      }
      return res;
    }""")
    print("MAIN RULES:")
    print("\n".join(css))
    browser.close()