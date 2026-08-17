// =========== GSAP HELPERS (animaciones limpias) ===========
// GSAP se sirve desde /vendor/gsap/gsap.min.js (instalado local).
// API global: window.GPAnim
//   .enabled  -> booleano (gsap disponible y usuario no pidió menos movimiento)
//   .reveal(el)       -> anima un elemento (fade-up) cuando entra al viewport
//   .revealAll(sel)   -> aplica reveal a un selector
//   .refresh()        -> re-escanea tarjetas re-renderizadas (lo llaman los grids)
//   .to(el, vars)     -> passthrough a gsap.to (con fallback seguro)
window.GPAnim = (function(){
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var enabled = typeof window.gsap === 'function' && !prefersReduced;
  var io = null;

  function getIO(){
    if(!enabled) return null;
    if(!io && 'IntersectionObserver' in window){
      io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){
            var el = e.target;
            try{
              gsap.to(el, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', overwrite: true });
            }catch(err){}
            io.unobserve(el);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    }
    return io;
  }

  function reveal(el){
    if(!enabled || !el || el.__gpAnimSeen) return;
    el.__gpAnimSeen = 1;
    var obs = getIO();
    if(!obs) return;
    try{
      gsap.set(el, { opacity: 0, y: 14 });
      obs.observe(el);
    }catch(err){}
  }

  function revealAll(selector){
    if(!enabled) return;
    document.querySelectorAll(selector).forEach(reveal);
  }

  function refresh(){
    if(!enabled) return;
    document.querySelectorAll('.pcard').forEach(reveal);
  }

  function to(el, vars){
    if(!enabled || !el || !vars) return;
    try{ gsap.to(el, vars); }catch(err){}
  }

  return {
    enabled: enabled,
    reveal: reveal,
    revealAll: revealAll,
    refresh: refresh,
    to: to
  };
})();

document.addEventListener('DOMContentLoaded', function(){
  if(!window.GPAnim || !GPAnim.enabled) return;
  // Reveal inicial de las tarjetas ya renderizadas (los grids re-llaman refresh()).
  GPAnim.refresh();
});
