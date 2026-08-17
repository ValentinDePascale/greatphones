// ============================================================
// GSAP HELPERS — animaciones fluidas y pulido (solo presentacional)
// GSAP se sirve desde /vendor/gsap/gsap.min.js (instalado local).
// API global: window.GPAnim
//   .enabled / .reveal / .revealAll / .refresh / .to
// Todo respeta prefers-reduced-motion y tiene fallback sin GSAP.
// ============================================================
window.GPAnim = (function(){
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var enabled = typeof window.gsap === 'function' && !reduced;
  var io = null;
  var SEC_REVEAL = '.sec-hdr,.sec-title,.cat-flex,.srv-grid';
  var PRESS_SEL = '.btn,.btn-o,.nbtn,.fchip,.cat-card,.cu-btn,.sec-more,.pcard-add,.cart-qty-btn,.cart-remove-btn';

  function safe(fn){ if(!enabled) return; try{ fn(); }catch(err){ /* nunca romper la UI */ } }

  // ---------- Intersección (reveal al scroll) ----------
  function getIO(){
    if(!enabled || io) return io;
    if('IntersectionObserver' in window){
      io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){
            var el = e.target;
            if(el.__gpKind === 'stagger') revealStagger(el);
            else revealOne(el);
            io.unobserve(el);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    }
    return io;
  }

  function hide(el){
    safe(function(){ gsap.set(el, { opacity: 0, y: 18, overwrite: true }); });
  }
  function show(el){
    safe(function(){
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', overwrite: true,
        onComplete: function(){ gsap.set(el, { clearProps: 'transform,opacity' }); }
      });
    });
  }
  function revealOne(el){
    if(!el || el.__gpSeen) return;
    el.__gpSeen = 1;
    hide(el);
    var obs = getIO();
    if(!obs){ gsap.set(el, { opacity: 1, y: 0 }); return; }
    obs.observe(el);
  }
  function revealStagger(el){
    var kids = el.querySelectorAll('.cat-card, .srv-card, .pcard');
    if(!kids.length){ revealOne(el); return; }
    safe(function(){
      gsap.fromTo(kids, { opacity: 0, y: 22 }, {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.055, overwrite: true,
        onComplete: function(){ gsap.set(kids, { clearProps: 'transform,opacity' }); }
      });
    });
    var obs = getIO();
    if(obs) obs.unobserve(el);
  }

  // ---------- Tarjetas re-renderizadas (grids) ----------
  function refresh(){
    if(!enabled) return;
    document.querySelectorAll('#shopGrid,#featuredGrid,#homeRail,#offerStrip,#favGrid,#accGrid').forEach(function(grid){
      var unseen = Array.prototype.filter.call(grid.querySelectorAll('.pcard'), function(c){ return !c.__gpSeen; });
      if(!unseen.length) return;
      unseen.forEach(function(c){ c.__gpSeen = 1; });
      gsap.fromTo(unseen, { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05, overwrite: true,
        onComplete: function(){ gsap.set(unseen, { clearProps: 'transform,opacity' }); }
      });
    });
    document.querySelectorAll(SEC_REVEAL).forEach(function(el){
      if(el.__gpSeen) return;
      el.__gpSeen = 1;
      el.__gpKind = (el.classList.contains('cat-flex') || el.classList.contains('srv-grid')) ? 'stagger' : 'single';
      var obs = getIO();
      if(!obs){ gsap.set(el, { opacity: 1, y: 0 }); return; }
      if(el.__gpKind === 'stagger'){ obs.observe(el); }
      else { hide(el); obs.observe(el); }
    });
  }

  function reveal(el){ revealOne(el); }
  function revealAll(sel){
    if(!enabled) return;
    document.querySelectorAll(sel).forEach(revealOne);
  }
  function to(el, vars){
    if(!enabled || !el || !vars) return;
    try{ gsap.to(el, vars); }catch(err){}
  }

  // ---------- Hero: entrada con stagger + parallax ----------
  function initHero(){
    if(!enabled) return;
    var slider = document.getElementById('heroSlider');
    if(!slider) return;
    if('IntersectionObserver' in window){
      var heroIO = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          var slide = e.target;
          if(e.isIntersecting){
            var kids = slide.querySelectorAll('.slide-tag, .slide-h, .slide-s, .slide-ctas');
            gsap.fromTo(kids, { opacity: 0, y: 24 }, {
              opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.09, overwrite: true,
              onComplete: function(){ gsap.set(kids, { clearProps: 'transform,opacity' }); }
            });
          }
        });
      }, { threshold: 0.45 });
      slider.querySelectorAll('.slide').forEach(function(s){ heroIO.observe(s); });
    }
    // Parallax sutil del hero (solo transform, GPU)
    var quick = null;
    try{ quick = gsap.quickTo(slider, 'y', { duration: 0.35, ease: 'power1.out' }); }catch(err){}
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        ticking = false;
        if(!quick) return;
        var r = slider.getBoundingClientRect();
        if(r.bottom > 0 && r.top < window.innerHeight){
          quick(Math.min(24, Math.max(-24, (r.top - window.innerHeight * 0.35) * 0.08)));
        } else {
          quick(0);
        }
      });
    }, { passive: true });
  }

  // ---------- Micro-feedback: press con rebote ----------
  function initPressFeedback(){
    if(!enabled) return;
    document.addEventListener('pointerdown', function(e){
      var t = e.target && e.target.closest ? e.target.closest(PRESS_SEL) : null;
      if(!t || t.disabled) return;
      safe(function(){ gsap.to(t, { scale: 0.96, duration: 0.12, ease: 'power1.out', overwrite: true }); });
    }, { passive: true });
    function release(e){
      var t = e.target && e.target.closest ? e.target.closest(PRESS_SEL) : null;
      if(!t) return;
      safe(function(){
        gsap.to(t, { scale: 1, duration: 0.3, ease: 'back.out(2)', overwrite: true,
          onComplete: function(){ gsap.set(t, { clearProps: 'transform' }); } });
      });
    }
    document.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointercancel', release, { passive: true });
  }

  // ---------- Focus trap para modales dinámicos ----------
  function initFocusTrap(){
    if(!('MutationObserver' in window)) return;
    function bindTrap(modal){
      if(modal.__gpTrap) return;
      modal.__gpTrap = function(ev){
        if(ev.key !== 'Tab') return;
        var focusables = modal.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if(!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if(ev.shiftKey && document.activeElement === first){ ev.preventDefault(); last.focus(); }
        else if(!ev.shiftKey && document.activeElement === last){ ev.preventDefault(); first.focus(); }
      };
      modal.addEventListener('keydown', modal.__gpTrap);
    }
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        m.addedNodes.forEach(function(n){
          if(!(n instanceof Element)) return;
          var modals = n.matches && n.matches('div[id$="Modal"],div[id$="Panel"]') ? [n] : [];
          if(n.querySelectorAll){
            n.querySelectorAll('div[id$="Modal"],div[id$="Panel"]').forEach(function(m2){ modals.push(m2); });
          }
          modals.forEach(bindTrap);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  // ---------- Sombra del topbar al scrollear ----------
  function initNavShadow(){
    var nav = document.querySelector('.mainnav');
    if(!nav) return;
    function upd(){ nav.classList.toggle('nav-scrolled', (window.scrollY || document.documentElement.scrollTop) > 8); }
    upd();
    window.addEventListener('scroll', upd, { passive: true });
  }

  // ---------- Init ----------
  function init(){
    if(!enabled) return;
    initHero();
    initPressFeedback();
    initFocusTrap();
    initNavShadow();
    refresh();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    enabled: enabled,
    reveal: reveal,
    revealAll: revealAll,
    refresh: refresh,
    to: to
  };
})();
