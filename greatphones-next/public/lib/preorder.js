// =========== PREVENTAS (PUBLIC) ===========
var PREORDER_PRODUCTS = [];

function loadPreorderProducts() {
  var grid = document.getElementById('preorderGrid');
  var loading = document.getElementById('preorderLoading');
  var empty = document.getElementById('preorderEmpty');
  if (!grid) return;
  grid.style.display = 'none';
  if (loading) loading.style.display = 'block';
  if (empty) empty.style.display = 'none';

  // Use server pre-fetched data if available
  if (window.__INITIAL_PREORDER_PRODUCTS__ && window.__INITIAL_PREORDER_PRODUCTS__.length > 0) {
    PREORDER_PRODUCTS = window.__INITIAL_PREORDER_PRODUCTS__;
    delete window.__INITIAL_PREORDER_PRODUCTS__;
    if (loading) loading.style.display = 'none';
    if (PREORDER_PRODUCTS.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }
    grid.style.display = 'grid';
    renderPreorderGrid();
    return;
  }

  fetch(API_URL + '/api/products?preorder=true&limit=50')
    .then(function(r) { return r.json(); })
    .then(function(res) {
      PREORDER_PRODUCTS = res.data || res || [];
      if (loading) loading.style.display = 'none';
      if (PREORDER_PRODUCTS.length === 0) {
        if (empty) empty.style.display = 'block';
        return;
      }
      grid.style.display = 'grid';
      renderPreorderGrid();
    })
    .catch(function() {
      if (loading) loading.style.display = 'none';
      if (empty) { empty.style.display = 'block'; empty.innerHTML = '<div style="font-size:60px;margin-bottom:1rem">&#x26A0;</div><p style="font-family:\'Playfair Display\',serif;font-size:22px;color:var(--dk);margin-bottom:.5rem">Error cargando productos</p><p style="font-size:13px;margin-bottom:1.5rem">No pudimos cargar los productos. Intenta nuevamente.</p><button class="btn btn-o" onclick="loadPreorderProducts()">Reintentar</button>'; }
    });
}

function renderPreorderGrid() {
  var grid = document.getElementById('preorderGrid');
  if (!grid || PREORDER_PRODUCTS.length === 0) return;

  var sort = document.getElementById('preorderSortSel');
  var sorted = PREORDER_PRODUCTS.slice();
  if (sort) {
    if (sort.value === 'asc') sorted.sort(function(a, b) { return a.price - b.price; });
    else if (sort.value === 'desc') sorted.sort(function(a, b) { return b.price - a.price; });
    else sorted.sort(function(a, b) { return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); });
  }

  grid.innerHTML = sorted.map(function(p) {
    return buildPreorderCard(p);
  }).join('');
}

function buildPreorderCard(p) {
  var imgHtml = p.imageUrl
    ? '<img src="' + p.imageUrl + '" style="width:100%;height:100%;object-fit:contain;transition:transform .4s ease" alt="' + p.name + '">'
    : '<span style="font-size:52px">' + (p.ico || '📱') + '</span>';

  var gradientColors = {
    'Titanio': 'linear-gradient(135deg,#b8b8b8 0%,#e0e0e0 50%,#909090 100%)',
    'Negro': 'linear-gradient(135deg,#2d2d2d 0%,#4a4a4a 50%,#1a1a1a 100%)',
    'Blanco': 'linear-gradient(135deg,#f5f5f5 0%,#ffffff 50%,#e8e8e8 100%)',
    'Azul': 'linear-gradient(135deg,#1a365d 0%,#2b6cb0 50%,#1a365d 100%)',
    'Rosa': 'linear-gradient(135deg,#fbb6ce 0%,#f687b3 50%,#d53f8c 100%)',
    'Verde': 'linear-gradient(135deg,#22543d 0%,#38a169 50%,#1a4731 100%)',
  };
  var bgGradient = gradientColors[p.color] || 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)';

  var dateStr = p.availableFrom
    ? new Date(p.availableFrom).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : 'Próximamente';

  var specsParts = [p.storage, p.condition].filter(Boolean).join(' · ');

  return '<div class="preorder-card" onclick="openDetail(\'' + p.id + '\');nav(\'detail\')" style="background:#fff;border-radius:16px;overflow:hidden;border:1.5px solid var(--border);cursor:pointer;transition:all .3s cubic-bezier(.2,.8,.2,1);position:relative">' +
    '<div style="position:absolute;top:12px;left:12px;z-index:2;display:inline-flex;align-items:center;gap:4px;background:rgba(255,107,44,.12);border:1px solid rgba(255,107,44,.25);padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;color:var(--orange);letter-spacing:.3px">&#x2B50; Próximamente</div>' +
    '<div style="aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden" onmouseover="var img=this.querySelector(\'img\');if(img)img.style.transform=\'scale(1.05)\'" onmouseout="var img=this.querySelector(\'img\');if(img)img.style.transform=\'scale(1)\'">' +
      '<div style="position:absolute;inset:0;opacity:.06;background:' + bgGradient + '"></div>' +
      imgHtml +
    '</div>' +
    '<div style="padding:16px">' +
      '<div style="font-family:\'Playfair Display\',Georgia,serif;font-size:18px;font-weight:700;color:var(--dk);margin-bottom:2px;letter-spacing:-.2px">' + p.name + '</div>' +
      (specsParts ? '<div style="font-size:11px;color:#8B7355;margin-bottom:10px">' + specsParts + '</div>' : '<div style="height:6px"></div>') +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;font-size:12px;color:var(--orange);font-weight:600">' +
        '<span style="font-size:14px">&#x1F4C5;</span>' +
        '<span>Disponible ' + dateStr + '</span>' +
      '</div>' +
      '<div style="font-family:\'Playfair Display\',Georgia,serif;font-size:24px;font-weight:700;color:var(--orange);margin-bottom:10px">' + fmt(p.price) + '</div>' +
      '<button onclick="event.stopPropagation();addToCart(\'' + p.id + '\',this,null,true,\'' + (p.availableFrom || '') + '\')" class="preorder-reserve-btn" style="width:100%;padding:12px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' +
        'Reservar' +
      '</button>' +
    '</div>' +
  '</div>';
}

function scrollToPreorderGrid() {
  var el = document.getElementById('preorder-grid-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function togglePreorderInfo() {
  var panel = document.getElementById('preorder-info-panel');
  if (!panel) return;
  if (panel.style.display === 'none' || !panel.style.display) {
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
}
