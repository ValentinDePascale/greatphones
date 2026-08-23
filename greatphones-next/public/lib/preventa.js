// =========== PREVENTAS ===========
var _preventaSearchTimer = null

function renderPreventaTab(subtab) {
  var el = document.getElementById('preventa-view')
  if (!el) return
  el.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap" class="instore-tabs">' +
      '<button class="ord-btn' + (subtab === 'catalogo' || !subtab ? ' ord-btn-act' : '') + '" id="prevTabCatalogo" onclick="renderPreventaTab(\'catalogo\')">Catalogo Preventa</button>' +
      '<button class="ord-btn' + (subtab === 'online' ? ' ord-btn-act' : '') + '" id="prevTabOnline" onclick="renderPreventaTab(\'online\')">Preventas Online</button>' +
      '<button class="ord-btn' + (subtab === 'local' ? ' ord-btn-act' : '') + '" id="prevTabLocal" onclick="renderPreventaTab(\'local\')">Preventa Local</button>' +
      '<button class="ord-btn' + (subtab === 'history' ? ' ord-btn-act' : '') + '" id="prevTabHistory" onclick="renderPreventaTab(\'history\')">Historial</button>' +
    '</div>' +
    '<div id="preventa-subview"></div>'
  if (subtab === 'local') renderPreventaLocal()
  else if (subtab === 'history') renderPreventaHistory()
  else if (subtab === 'online') renderPreventaOnlineLive()
  else renderPreventaCatalogo()
}

function renderPreventaLocal() {
  var sub = document.getElementById('preventa-subview')
  if (!sub) return
  var iphoneModels = (window.SELL_MODELS && window.SELL_MODELS['iPhone']) || []
  var conditions = ['Nuevo', 'Impecable', 'Muy bueno', 'Bueno', 'Con daños']
  sub.innerHTML =
    '<div style="background:var(--cream2);padding:1.5rem;border-radius:12px;border:1px solid var(--border);margin-bottom:1.5rem">' +
      '<h3 style="font-size:18px;font-weight:700;margin-bottom:1.5rem;display:flex;align-items:center;gap:8px">' +
        '<span class="material-symbols-outlined" style="font-size:24px;color:var(--orange)">event</span> Nueva Preventa Local</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' +
        // Client fields
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Nombre del Cliente *</label>' +
          '<input type="text" id="prev-clientName" placeholder="Nombre completo" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box"></div>' +
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">DNI</label>' +
          '<input type="text" id="prev-clientDni" placeholder="12345678" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box"></div>' +
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Teléfono</label>' +
          '<input type="text" id="prev-clientPhone" placeholder="2914727351" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box"></div>' +
        '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Email</label>' +
          '<input type="email" id="prev-clientEmail" placeholder="cliente@email.com" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box"></div>' +
      '</div>' +
      '<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">' +
        '<h4 style="font-size:14px;font-weight:700;margin-bottom:1rem">Producto</h4>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Modelo iPhone *</label>' +
            '<select id="prev-modelName" onchange="onPrevModelChange()" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff">' +
              '<option value="">Seleccionar modelo...</option>' +
              iphoneModels.map(function(m) { return '<option value="' + m + '">' + m + '</option>' }).join('') +
            '</select></div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Color</label>' +
            '<div id="prev-colorContainer" style="min-height:38px;display:flex;align-items:center;flex-wrap:wrap;gap:6px"></div></div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Almacenamiento</label>' +
            '<select id="prev-storage" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff">' +
              '<option value="">Seleccionar...</option>' +
              '<option value="64 GB">64 GB</option>' +
              '<option value="128 GB">128 GB</option>' +
              '<option value="256 GB">256 GB</option>' +
              '<option value="512 GB">512 GB</option>' +
              '<option value="1 TB">1 TB</option>' +
            '</select></div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Condición</label>' +
            '<select id="prev-condition" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff">' +
              conditions.map(function(c) { return '<option value="' + c + '">' + c + '</option>' }).join('') +
            '</select></div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">' +
        '<h4 style="font-size:14px;font-weight:700;margin-bottom:1rem">Precio y Pago</h4>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Precio Acordado *</label>' +
            '<input type="number" id="prev-price" placeholder="0" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box"></div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Método de Pago</label>' +
            '<select id="prev-paymentMethod" onchange="onPrevPaymentChange()" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff">' +
              '<option value="">Seleccionar...</option>' +
              '<option value="cash">Efectivo</option>' +
              '<option value="transfer">Transferencia</option>' +
            '</select></div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Tipo de Pago</label>' +
            '<select id="prev-paymentType" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff">' +
              '<option value="single">Pago Único</option>' +
              '<option value="installments">Cuotas</option>' +
            '</select></div>' +
          '<div id="prev-installmentsWrap" style="display:none"><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Cantidad de Cuotas</label>' +
            '<select id="prev-installments" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;background:#fff">' +
              '<option value="2">2 cuotas</option>' +
              '<option value="3">3 cuotas</option>' +
              '<option value="6">6 cuotas</option>' +
              '<option value="12">12 cuotas</option>' +
            '</select></div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">' +
        '<h4 style="font-size:14px;font-weight:700;margin-bottom:1rem">Entrega Estimada</h4>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Desde</label>' +
            '<input type="date" id="prev-deliveryStart" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box"></div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Hasta</label>' +
            '<input type="date" id="prev-deliveryEnd" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box"></div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:1rem"><label style="font-size:10px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px">Notas</label>' +
        '<textarea id="prev-notes" placeholder="Detalles de la preventa..." style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;min-height:60px;box-sizing:border-box"></textarea></div>' +
      '<div style="margin-top:1rem"><button onclick="crearPreventa()" class="btn btn-primary" style="padding:12px 28px;font-weight:700">Guardar Preventa</button></div>' +
    '</div>' +
    '<div id="prev-recentList"></div>'
  loadPreventaRecent()
}

function onPrevModelChange() {
  var model = document.getElementById('prev-modelName').value
  var container = document.getElementById('prev-colorContainer')
  if (!model || !window.MODEL_COLORS || !window.MODEL_COLORS[model]) {
    container.innerHTML = '<span style="font-size:12px;color:var(--gray)">Seleccioná un modelo primero</span>'
    return
  }
  var colors = window.MODEL_COLORS[model]
  var hexMap = window.COLOR_HEX || {}
  container.innerHTML = colors.map(function(c) {
    var hex = hexMap[c] || '#ccc'
    return '<div onclick="selectPrevColor(\'' + c.replace(/'/g, "\\'") + '\',this)" style="width:32px;height:32px;border-radius:50%;background:' + hex + ';cursor:pointer;border:2px solid transparent;transition:all .15s;position:relative" title="' + c + '" onmouseover="this.style.transform=\'scale(1.15)\'" onmouseout="this.style.transform=\'\'"></div>'
  }).join('')
}

function selectPrevColor(color, el) {
  window._prevSelectedColor = color
  var parent = el.parentElement
  if (parent) {
    parent.querySelectorAll('div').forEach(function(d) { d.style.borderColor = 'transparent' })
  }
  el.style.borderColor = '#333'
}

function onPrevPaymentChange() {
  var method = document.getElementById('prev-paymentMethod').value
  var wrap = document.getElementById('prev-installmentsWrap')
  wrap.style.display = method === 'transfer' ? 'block' : 'none'
}

function crearPreventa() {
  var clientName = document.getElementById('prev-clientName').value.trim()
  var clientDni = document.getElementById('prev-clientDni').value.trim()
  var clientPhone = document.getElementById('prev-clientPhone').value.trim()
  var clientEmail = document.getElementById('prev-clientEmail').value.trim()
  var modelName = document.getElementById('prev-modelName').value
  var storage = document.getElementById('prev-storage').value
  var condition = document.getElementById('prev-condition').value
  var price = document.getElementById('prev-price').value.trim()
  var paymentMethod = document.getElementById('prev-paymentMethod').value
  var paymentType = document.getElementById('prev-paymentType').value
  var installments = document.getElementById('prev-installments').value
  var deliveryStart = document.getElementById('prev-deliveryStart').value
  var deliveryEnd = document.getElementById('prev-deliveryEnd').value
  var notes = document.getElementById('prev-notes').value.trim()

  if (!clientName) { showToast({ title: 'Error', message: 'El nombre del cliente es obligatorio', type: 'error' }); return }
  if (!modelName) { showToast({ title: 'Error', message: 'Seleccioná un modelo de iPhone', type: 'error' }); return }
  if (!price) { showToast({ title: 'Error', message: 'Ingresá el precio acordado', type: 'error' }); return }

  var body = {
    clientName: clientName,
    clientDni: clientDni || null,
    clientPhone: clientPhone || null,
    clientEmail: clientEmail || null,
    productModelName: modelName,
    productStorage: storage || null,
    productColor: window._prevSelectedColor || null,
    productCondition: condition || null,
    price: parseInt(price),
    paymentMethod: paymentMethod || null,
    paymentType: paymentType || null,
    installments: paymentType === 'installments' ? parseInt(installments) : null,
    expectedDeliveryStart: deliveryStart || null,
    expectedDeliveryEnd: deliveryEnd || null,
    notes: notes || null
  }

  fetch(API_URL + '/api/admin/preorders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  }).then(function(r) { return r.json() }).then(function(res) {
    if (res.error) { showToast({ title: 'Error', message: res.error, type: 'error' }); return }
    showToast({ title: 'Preventa creada', message: 'Código: ' + res.code, type: 'success' })
    // Reset form
    document.getElementById('prev-clientName').value = ''
    document.getElementById('prev-clientDni').value = ''
    document.getElementById('prev-clientPhone').value = ''
    document.getElementById('prev-clientEmail').value = ''
    document.getElementById('prev-modelName').value = ''
    document.getElementById('prev-storage').value = ''
    document.getElementById('prev-condition').value = 'Nuevo'
    document.getElementById('prev-price').value = ''
    document.getElementById('prev-paymentMethod').value = ''
    document.getElementById('prev-paymentType').value = 'single'
    document.getElementById('prev-installments').value = '3'
    document.getElementById('prev-deliveryStart').value = ''
    document.getElementById('prev-deliveryEnd').value = ''
    document.getElementById('prev-notes').value = ''
    document.getElementById('prev-colorContainer').innerHTML = '<span style="font-size:12px;color:var(--gray)">Seleccioná un modelo primero</span>'
    window._prevSelectedColor = null
    document.getElementById('prev-installmentsWrap').style.display = 'none'
    loadPreventaRecent()
  }).catch(function(err) {
    console.error('Error creating preventa:', err)
    showToast({ title: 'Error', message: 'Error al crear preventa', type: 'error' })
  })
}

function loadPreventaRecent() {
  var list = document.getElementById('prev-recentList')
  if (!list) return
  fetch(API_URL + '/api/admin/preorders?status=PENDING', {
    headers: {}
  }).then(function(r) { return r.json() }).then(function(data) {
    if (!Array.isArray(data) || !data.length) {
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray)"><div style="font-size:32px;margin-bottom:.5rem">📝</div><p>No hay preventas pendientes</p></div>'
      return
    }
    list.innerHTML = '<h4 style="font-size:14px;font-weight:700;margin-bottom:.75rem">Pendientes Recientes</h4>' +
      data.slice(0, 5).map(function(o) { return renderPreventaCard(o) }).join('')
  }).catch(function(err) {
    console.error('Error loading recent preorders:', err)
  })
}

// =========== HISTORIAL ===========

function renderPreventaHistory() {
  var sub = document.getElementById('preventa-subview')
  if (!sub) return
  sub.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap;align-items:center">' +
      '<button onclick="prevFilter(\'PENDING\')" class="ord-btn" id="prevFilPENDING">Pendientes</button>' +
      '<button onclick="prevFilter(\'CONFIRMED\')" class="ord-btn" id="prevFilCONFIRMED">Confirmadas</button>' +
      '<button onclick="prevFilter(\'DELIVERED\')" class="ord-btn" id="prevFilDELIVERED">Entregadas</button>' +
      '<button onclick="prevFilter(\'CANCELLED\')" class="ord-btn" id="prevFilCANCELLED">Canceladas</button>' +
      '<button onclick="prevFilter(\'all\')" class="ord-btn" id="prevFilAll">Todas</button>' +
      '<input type="text" id="prev-searchInput" placeholder="Buscar por nombre, DNI o modelo..." oninput="onPrevSearch(this.value)" style="flex:1;max-width:350px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;outline:none">' +
    '</div>' +
    '<div id="prev-historyList"></div>'
  window._prevFilter = 'PENDING'
  setPrevFilterActive('PENDING')
  loadPreventaList('PENDING', '')
}

function setPrevFilterActive(f) {
  ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'all'].forEach(function(k) {
    var b = document.getElementById('prevFil' + k)
    if (b) b.classList.toggle('ord-btn-act', k === f)
  })
}

function prevFilter(f) {
  window._prevFilter = f
  setPrevFilterActive(f)
  var q = document.getElementById('prev-searchInput') ? document.getElementById('prev-searchInput').value : ''
  loadPreventaList(f, q)
}

function onPrevSearch(q) {
  clearTimeout(_preventaSearchTimer)
  _preventaSearchTimer = setTimeout(function() {
    var f = window._prevFilter || 'PENDING'
    loadPreventaList(f, q)
  }, 300)
}

function loadPreventaList(status, search) {
  var list = document.getElementById('prev-historyList')
  if (!list) return
  var params = []
  if (status && status !== 'all') params.push('status=' + status)
  if (search) params.push('search=' + encodeURIComponent(search))
  var url = API_URL + '/api/admin/preorders' + (params.length ? '?' + params.join('&') : '')
  list.innerHTML = '<div class="loader-spinner"><span>Cargando...</span></div>'
  fetch(url, { headers: {} })
    .then(function(r) { return r.json() })
    .then(function(data) {
      if (!Array.isArray(data) || !data.length) {
        list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray)"><div style="font-size:44px;margin-bottom:.5rem">📝</div><p>No se encontraron preventas</p></div>'
        return
      }
      list.innerHTML = data.map(function(o) { return renderPreventaCard(o) }).join('')
    })
    .catch(function(err) {
      console.error('Error loading preorders:', err)
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--red)">Error al cargar preventas</div>'
    })
}

function renderPreventaCard(o) {
  var statusColors = { PENDING: 'var(--orange)', CONFIRMED: 'var(--green)', DELIVERED: '#009ee3', CANCELLED: 'var(--red)' }
  var statusLabels = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', DELIVERED: 'Entregada', CANCELLED: 'Cancelada' }
  var sc = statusColors[o.status] || 'var(--gray)'
  var sl = statusLabels[o.status] || o.status

  var productLine = [o.productModelName, o.productStorage, o.productColor].filter(Boolean).join(' · ') || '—'
  var priceHtml = o.price > 0 ? '<div style="font-size:16px;font-weight:800;color:var(--orange)">' + fmt(o.price) + '</div>' : ''

  return '<div style="background:#fff;border-radius:12px;padding:1rem;margin-bottom:.75rem;border:1px solid var(--border);display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:200px">' +
      '<div style="font-weight:700;font-size:14px">' + escapeHtml(productLine) + '</div>' +
      '<div style="font-size:12px;color:var(--gray)">' + escapeHtml(o.clientName || '') + (o.clientDni ? ' · DNI: ' + escapeHtml(o.clientDni) : '') + '</div>' +
      '<div style="font-size:11px;color:var(--gray)">' + o.code + ' · ' + (o.clientPhone || o.clientEmail || '') + '</div>' +
    '</div>' +
    '<div style="text-align:right;margin-right:1rem">' +
      priceHtml +
      '<span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:10px;background:' + sc + '15;color:' + sc + '">' + sl + '</span>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      (o.status === 'PENDING'
        ? '<button onclick="confirmPreventaAction(\'' + o.id + '\',\'CONFIRMED\')" class="btn btn-g btn-sm">Confirmar</button>' +
          '<button onclick="confirmPreventaAction(\'' + o.id + '\',\'DELIVERED\')" class="btn btn-o btn-sm">Entregar</button>' +
          '<button onclick="confirmPreventaAction(\'' + o.id + '\',\'CANCELLED\')" class="btn btn-sm" style="background:var(--red);color:#fff">Cancelar</button>'
        : '') +
      (o.status === 'CONFIRMED'
        ? '<button onclick="confirmPreventaAction(\'' + o.id + '\',\'DELIVERED\')" class="btn btn-o btn-sm">Marcar Entregado</button>' +
          '<button onclick="confirmPreventaAction(\'' + o.id + '\',\'CANCELLED\')" class="btn btn-sm" style="background:var(--red);color:#fff">Cancelar</button>'
        : '') +
      '<button onclick="renderPreventaDetail(\'' + o.id + '\')" class="btn btn-sm" style="background:var(--cream2)">Detalle</button>' +
    '</div>' +
  '</div>'
}

function renderPreventaDetail(id) {
  fetch(API_URL + '/api/admin/preorders/' + id, {
    headers: {}
  }).then(function(r) { return r.json() }).then(function(o) {
    if (o.error) { showToast({ title: 'Error', message: o.error, type: 'error' }); return }
    showPreventaDetailModal(o)
  }).catch(function(err) {
    console.error('Error loading preorder detail:', err)
    showToast({ title: 'Error', message: 'Error al cargar detalle', type: 'error' })
  })
}

function showPreventaDetailModal(o) {
  var overlay = document.createElement('div')
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem'
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove() }

  var statusColors = { PENDING: 'var(--orange)', CONFIRMED: 'var(--green)', DELIVERED: '#009ee3', CANCELLED: 'var(--red)' }
  var statusLabels = { PENDING: 'Pendiente', CONFIRMED: 'Confirmada', DELIVERED: 'Entregada', CANCELLED: 'Cancelada' }
  var sc = statusColors[o.status] || 'var(--gray)'
  var sl = statusLabels[o.status] || o.status

  var paymentLabels = { cash: 'Efectivo', transfer: 'Transferencia' }
  var paymentTypes = { single: 'Pago Único', installments: 'Cuotas' }
  var condLabels = { Nuevo: 'Nuevo', Impecable: 'Impecable', 'Muy bueno': 'Muy Bueno', Bueno: 'Bueno', 'Con daños': 'Con Daños' }

  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;padding:1.5rem" onclick="event.stopPropagation()">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">' +
        '<h3 style="font-size:18px;font-weight:700">Detalle de Preventa</h3>' +
        '<button onclick="this.closest(\'[style*=\\\'z-index\\\']\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--gray)">&times;</button>' +
      '</div>' +
      '<div style="display:grid;gap:10px;font-size:13px">' +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Código</span><span style="font-weight:600">' + o.code + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Estado</span><span style="font-weight:600;color:' + sc + '">' + sl + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Cliente</span><span style="font-weight:600">' + escapeHtml(o.clientName || '') + '</span></div>' +
        (o.clientDni ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">DNI</span><span style="font-weight:600">' + escapeHtml(o.clientDni) + '</span></div>' : '') +
        (o.clientPhone ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Teléfono</span><span style="font-weight:600">' + escapeHtml(o.clientPhone) + '</span></div>' : '') +
        (o.clientEmail ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Email</span><span style="font-weight:600">' + escapeHtml(o.clientEmail) + '</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Modelo</span><span style="font-weight:600">' + (o.productModelName || '—') + '</span></div>' +
        (o.productStorage ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Almacenamiento</span><span style="font-weight:600">' + o.productStorage + '</span></div>' : '') +
        (o.productColor ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Color</span><span style="font-weight:600">' + o.productColor + '</span></div>' : '') +
        (o.productCondition ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Condición</span><span style="font-weight:600">' + (condLabels[o.productCondition] || o.productCondition) + '</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Precio</span><span style="font-weight:700;color:var(--orange)">' + (o.price > 0 ? fmt(o.price) : '—') + '</span></div>' +
        (o.paymentMethod ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Método de Pago</span><span style="font-weight:600">' + (paymentLabels[o.paymentMethod] || o.paymentMethod) + '</span></div>' : '') +
        (o.paymentType ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Tipo de Pago</span><span style="font-weight:600">' + (paymentTypes[o.paymentType] || o.paymentType) + (o.installments ? ' (' + o.installments + ' cuotas)' : '') + '</span></div>' : '') +
        (o.expectedDeliveryStart ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Entrega Estimada</span><span style="font-weight:600">' + new Date(o.expectedDeliveryStart).toLocaleDateString('es-AR') + (o.expectedDeliveryEnd ? ' - ' + new Date(o.expectedDeliveryEnd).toLocaleDateString('es-AR') : '') + '</span></div>' : '') +
        (o.deliveredAt ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="color:var(--gray)">Entregado</span><span style="font-weight:600">' + new Date(o.deliveredAt).toLocaleDateString('es-AR') + '</span></div>' : '') +
        (o.notes ? '<div style="padding:8px 0"><span style="color:var(--gray);display:block;margin-bottom:4px">Notas</span><span style="font-weight:600;font-size:12px;background:var(--cream2);padding:8px 10px;border-radius:8px;display:block">' + escapeHtml(o.notes) + '</span></div>' : '') +
      '</div>' +
      '<div style="margin-top:1rem;display:flex;gap:8px;flex-wrap:wrap">' +
        (o.status === 'PENDING'
          ? '<button onclick="this.closest(\'[style*=\\\'z-index\\\']\').remove();confirmPreventaAction(\'' + o.id + '\',\'CONFIRMED\')" class="btn btn-g" style="flex:1">Confirmar</button>' +
            '<button onclick="this.closest(\'[style*=\\\'z-index\\\']\').remove();confirmPreventaAction(\'' + o.id + '\',\'DELIVERED\')" class="btn btn-o" style="flex:1">Entregar</button>' +
            '<button onclick="this.closest(\'[style*=\\\'z-index\\\']\').remove();confirmPreventaAction(\'' + o.id + '\',\'CANCELLED\')" class="btn" style="flex:1;background:var(--red);color:#fff">Cancelar</button>'
          : '') +
        (o.status === 'CONFIRMED'
          ? '<button onclick="this.closest(\'[style*=\\\'z-index\\\']\').remove();confirmPreventaAction(\'' + o.id + '\',\'DELIVERED\')" class="btn btn-o" style="flex:1">Marcar Entregado</button>' +
            '<button onclick="this.closest(\'[style*=\\\'z-index\\\']\').remove();confirmPreventaAction(\'' + o.id + '\',\'CANCELLED\')" class="btn" style="flex:1;background:var(--red);color:#fff">Cancelar</button>'
          : '') +
      '</div>' +
    '</div>'
  document.body.appendChild(overlay)
}

// =========== ACCIONES ===========

function confirmPreventaAction(id, action) {
  var labels = { CONFIRMED: 'confirmar', DELIVERED: 'marcar como entregada', CANCELLED: 'cancelar' }
  var msg = action === 'DELIVERED'
    ? 'Al marcar como entregada se creará una orden de venta automáticamente. ¿Continuar?'
    : '¿Estás seguro de ' + (labels[action] || action) + ' esta preventa?'

  if (typeof showConfirm === 'function') {
    showConfirm('¿' + (labels[action] || action) + ' preventa?', msg, {
      confirmText: action === 'CANCELLED' ? 'Cancelar Preventa' : (labels[action] || action),
      confirmClass: action === 'CANCELLED' ? 'danger' : 'primary'
    }).then(function(confirmed) {
      if (confirmed) executePreventaAction(id, action)
    })
  } else {
    if (confirm(msg)) executePreventaAction(id, action)
  }
}

function executePreventaAction(id, status) {
  fetch(API_URL + '/api/admin/preorders/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify({ status: status })
  }).then(function(r) { return r.json() }).then(function(res) {
    if (res.error) { showToast({ title: 'Error', message: res.error, type: 'error' }); return }
    var msg = status === 'DELIVERED' ? 'Preventa entregada — orden creada' : 'Preventa actualizada'
    showToast({ title: 'Éxito', message: msg, type: 'success' })
    refreshPreventaView()
  }).catch(function(err) {
    console.error('Error updating preventa:', err)
    showToast({ title: 'Error', message: 'Error al actualizar preventa', type: 'error' })
  })
}

function refreshPreventaView() {
  var activeTab = document.querySelector('#preventa-view .ord-btn-act')
  if (activeTab) {
    var sub = activeTab.id === 'prevTabLocal' ? 'local' : activeTab.id === 'prevTabHistory' ? 'history' : 'online'
    renderPreventaTab(sub)
  }
}

// =========== PREVENTA CATALOGO (admin manage preorder products) ===========

function renderPreventaCatalogo() {
  var sub = document.getElementById('preventa-subview')
  if (!sub) return
  sub.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:1rem;align-items:center;flex-wrap:wrap">' +
      '<button class="btn btn-o" onclick="openPreventaForm()">+ Nueva Preventa</button>' +
    '</div>' +
    '<div id="prevCatalogGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem"></div>' +
    '<div id="prevCatalogLoading" style="text-align:center;padding:3rem;color:var(--gray)">Cargando...</div>'
  loadPreventaProducts()
}

function loadPreventaProducts() {
  var grid = document.getElementById('prevCatalogGrid')
  var loading = document.getElementById('prevCatalogLoading')
  if (!grid) return
  grid.innerHTML = ''
  if (loading) loading.style.display = 'block'

  var hdrs = {};
  fetch(API_URL + '/api/products?preorder=true&limit=50', { headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (loading) loading.style.display = 'none'
      var prods = res.data || res || []
      if (prods.length === 0) {
        grid.innerHTML = '<div style="text-align:center;padding:3rem;grid-column:1/-1;color:var(--gray)"><p style="font-size:40px;margin-bottom:1rem">&#x1F4E6;</p><p style="font-size:16px;font-weight:600;margin-bottom:8px">No hay productos de preventa</p><p style="font-size:13px">Crea el primer producto desde el boton "Nueva Preventa"</p></div>'
        return
      }
      grid.innerHTML = prods.map(function(p) {
        var img = p.imageUrl ? '<img src="' + p.imageUrl + '" style="width:100%;height:100%;object-fit:cover">' : '<span style="font-size:40px">' + (p.ico || '&#x1F4F1;') + '</span>'
        var dateStr = p.availableFrom ? new Date(p.availableFrom).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : 'Sin fecha'
        return '<div class="acard" style="padding:1rem">' +
          '<div style="display:flex;gap:12px;align-items:flex-start">' +
            '<div style="width:64px;height:64px;background:var(--admin-input-bg);border-radius:10px;overflow:hidden;flex-shrink:0">' + img + '</div>' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:14px;font-weight:700;margin-bottom:2px">' + p.name + '</div>' +
              '<div style="font-size:11px;color:var(--gray);margin-bottom:6px">' + (p.storage || '') + ' ' + (p.color || '') + ' · ' + (p.condition || '') + '</div>' +
              '<div style="font-size:12px;color:var(--orange);font-weight:600">Disponible: ' + dateStr + '</div>' +
              '<div style="font-size:16px;font-weight:700;margin:4px 0">' + fmt(p.price) + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;margin-top:10px">' +
            '<button class="admin-btn" onclick="editPreventaProduct(\'' + p.id + '\')" style="flex:1;font-size:11px;justify-content:center">&#x270F; Editar</button>' +
            '<button class="admin-btn" onclick="deletePreventaProduct(\'' + p.id + '\')" style="color:var(--red);font-size:11px;justify-content:center">&#x1F5D1; Eliminar</button>' +
          '</div>' +
        '</div>';
      }).join('')
    })
    .catch(function() {
      if (loading) loading.style.display = 'none'
      grid.innerHTML = '<div style="text-align:center;padding:3rem;grid-column:1/-1;color:var(--red)">Error cargando productos</div>'
    })
}

var _prevWizardData = { rows: [] }
var _prevWizardStep = 1

function openPreventaForm(editData) {
  var sub = document.getElementById('preventa-subview')
  if (!sub) return
  var isEdit = !!editData && editData.modelGroup
  var brands = typeof getUniqueBrands === 'function' ? getUniqueBrands() : ['iPhone','Samsung','MacBook','iPad','Motorola','Xiaomi','Google','Apple']
  var currentBrand = isEdit ? (editData.brand || 'iPhone') : 'iPhone'
  var brandOpts = brands.map(function(b) { return '<option value="' + b + '"' + (b === currentBrand ? ' selected' : '') + '>' + b + '</option>' }).join('')
  var iphoneModels = (window.SELL_MODELS && window.SELL_MODELS['iPhone']) || []

  // En edición, cargamos las combinaciones del grupo y vamos al paso 2
  var preRows = []
  if (isEdit) {
    var grp = editData.modelGroup
    if (typeof PRODUCTS !== 'undefined' && PRODUCTS) {
      PRODUCTS.forEach(function(p) {
        if (p.isPreorder && p.modelGroup === grp) {
          preRows.push({ color: p.color || '', storage: p.storage || '', price: p.price || '', availableFrom: p.availableFrom ? p.availableFrom.split('T')[0] : '' })
        }
      })
    }
  }
  _prevWizardData = { model: editData || null, rows: preRows }
  _prevWizardStep = 1

  sub.innerHTML =
    '<div style="background:#fff;border-radius:16px;border:1px solid var(--border);padding:1.75rem;max-width:820px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:10px">' +
        '<div><div style="font-size:20px;font-weight:700;color:var(--dk);font-family:\'Playfair Display\',serif">' + (isEdit ? 'Editar preventa' : 'Nueva preventa') + '</div>' +
        '<div style="font-size:12px;color:var(--gray);margin-top:2px">Creá un modelo y sumá las combinaciones color × almacenamiento con su precio y disponibilidad.</div></div>' +
        '<button onclick="renderPreventaCatalogo()" style="background:none;border:1px solid var(--border);color:var(--gray);cursor:pointer;font-size:13px;padding:8px 14px;border-radius:10px">← Volver</button>' +
      '</div>' +
      renderWizardSteps() +
      '<div id="prevWizardBody" style="margin-top:1.5rem"></div>' +
      '<div id="prevWizardNav" style="margin-top:1.5rem"></div>' +
    '</div>' +
    '<div id="prevColorPickerHost" style="position:fixed;display:none;inset:0;z-index:1300;background:rgba(0,0,0,.5);align-items:center;justify-content:center" onclick="if(event.target===this)closePrevColorPicker()"></div>'

  renderPrevWizardStep(_prevWizardStep)
}

function renderWizardSteps() {
  var steps = [
    ['1','Datos del modelo','var(--green)'],
    ['2','Combinaciones','var(--orange)'],
    ['3','Revisar y guardar','var(--blue)'],
  ]
  var dots = {}
  return '<div style="display:flex;gap:8px;margin-bottom:.25rem;flex-wrap:wrap">' + steps.map(function(s) {
    return '<button onclick="_prevWizardStep=' + s[0] + ';renderPrevWizardStep(' + s[0] + ')" data-step="' + s[0] + '" class="prev-step-dot" style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:100px;border:1.5px solid var(--border);background:#fff;font-size:12px;font-weight:600;color:var(--gray);cursor:pointer;transition:all .18s">' +
      '<span style="width:22px;height:22px;border-radius:50%;background:' + s[1] + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">' + s[0] + '</span>' + s[1] +
    '</button>'
  }).join('') + '</div>'
}

function setPrevStepActive(step) {
  document.querySelectorAll('.prev-step-dot').forEach(function(b,i) {
    var n = parseInt(b.getAttribute('data-step'),10)
    b.style.borderColor = n === step ? 'var(--orange)' : 'var(--border)'
    b.style.background = n === step ? 'rgba(255,107,44,.06)' : '#fff'
    b.style.color = n === step ? 'var(--dk)' : 'var(--gray)'
  })
}

function renderPrevWizardStep(step) {
  _prevWizardStep = step
  var body = document.getElementById('prevWizardBody')
  var nav = document.getElementById('prevWizardNav')
  setPrevStepActive(step)
  var isEdit = !!(_prevWizardData && _prevWizardData.model && _prevWizardData.model.modelGroup)
  var brands = typeof getUniqueBrands === 'function' ? getUniqueBrands() : ['iPhone','Samsung','MacBook','iPad','Motorola','Xiaomi','Google','Apple']
  var iphoneModels = (window.SELL_MODELS && window.SELL_MODELS['iPhone']) || []
  var m = (_prevWizardData && _prevWizardData.model) || {}
  var _curModel = m.modelGroup || m.name || ''
  var brandOpts = brands.map(function(b) { return '<option value="' + b + '"' + (b === (m.brand || 'iPhone') ? ' selected' : '') + '>' + b + '</option>' }).join('')

  if (step === 1) {
    body.innerHTML =
      '<div style="display:grid;gap:14px">' +
        '<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.25);border-radius:12px;padding:12px 16px;display:flex;gap:10px;align-items:flex-start;margin-bottom:6px">' +
          '<span style="width:26px;height:26px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">1</span>' +
          '<div><div style="font-size:14px;font-weight:700;color:var(--dk);margin-bottom:2px">Datos del modelo</div>' +
          '<div style="font-size:12px;color:var(--gray)">Definí qué dispositivo vas a ofrecer en preventa.</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px;color:var(--gray)">Marca</label><select class="sel-f" id="pw-brand">' + brandOpts + '</select></div>' +
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px;color:var(--gray)">Modelo *</label><select class="sel-f" id="pw-model" onchange="onPrevWizardModel()"><option value="">Seleccionar modelo...</option>' + iphoneModels.map(function(opt){return '<option value="'+opt+'"'+(opt===_curModel?' selected':'')+'>'+opt+'</option>';}).join('') + '</select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px;color:var(--gray)">Tipo</label><select class="sel-f" id="pw-type"><option value="celular"'+(m.type==='celular'||!m.type?' selected':'')+'>Celular</option><option value="tablet"'+(m.type==='tablet'?' selected':'')+'>Tablet</option><option value="laptop"'+(m.type==='laptop'?' selected':'')+'>Laptop</option><option value="smartwatch"'+(m.type==='smartwatch'?' selected':'')+'>Smartwatch</option></select></div>' +
          '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px;color:var(--gray)">Condición</label><select class="sel-f" id="pw-condition"><option value="Nuevo" selected>Nuevo</option><option value="Impecable">Impecable</option></select></div>' +
        '</div>' +
        '<div><label style="font-size:11px;font-weight:600;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px;color:var(--gray)">Descripción</label>' +
          '<textarea class="inp-f" id="pw-description" rows="2" placeholder="Detalle de la preventa (opcional)" style="resize:none">' + (m.description || '') + '</textarea></div>' +
      '</div>'
    if (isEdit && m.modelGroup) document.getElementById('pw-model').value = m.modelGroup
    nav.innerHTML =
      '<div style="display:flex;justify-content:flex-end;gap:10px">' +
        '<button class="btn btn-o" onclick="prevWizardNext()" style="padding:12px 26px;font-weight:700">Siguiente: Combinaciones →</button>' +
      '</div>'
  } else if (step === 2) {
    body.innerHTML =
      '<div style="background:rgba(255,107,44,.06);border:1px solid rgba(255,107,44,.25);border-radius:12px;padding:12px 16px;display:flex;gap:10px;align-items:flex-start;margin-bottom:14px">' +
        '<span style="width:26px;height:26px;border-radius:50%;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">2</span>' +
        '<div><div style="font-size:14px;font-weight:700;color:var(--dk);margin-bottom:2px">Combinaciones</div>' +
        '<div style="font-size:12px;color:var(--gray)">Agregá cada color con su almacenamiento, precio y fecha de disponibilidad. Cada fila será una variante.</div></div>' +
      '</div>' +
      '<div id="pw-rows-wrap"></div>' +
      '<button onclick="addPrevWizardRow()" class="btn" style="width:100%;padding:14px;border:1.5px dashed var(--orange);background:rgba(255,107,44,.05);color:var(--orange);font-weight:700;margin-top:12px;cursor:pointer">+ Agregar combinación</button>'
    renderPrevWizardRows()
    nav.innerHTML =
      '<div style="display:flex;justify-content:space-between;gap:10px">' +
        '<button class="btn btn-ghost" onclick="_prevWizardStep=1;renderPrevWizardStep(1)" style="padding:12px 24px;color:var(--gray);border:1px solid var(--border);background:#fff">← Datos</button>' +
        '<button class="btn btn-o" onclick="prevWizardNext()" style="padding:12px 26px;font-weight:700;background:var(--orange)">Siguiente: Revisar →</button>' +
      '</div>'
  } else if (step === 3) {
    // Recoger datos y mostrar resumen
    var summary = renderPrevSummary()
    body.innerHTML =
      '<div style="background:rgba(59,130,246,.06);border:1px solid rgba(59,130,246,.2);border-radius:12px;padding:12px 16px;display:flex;gap:10px;align-items:flex-start;margin-bottom:14px">' +
        '<span style="width:26px;height:26px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">3</span>' +
        '<div><div style="font-size:14px;font-weight:700;color:var(--dk);margin-bottom:2px">Revisar y guardar</div>' +
        '<div style="font-size:12px;color:var(--gray)">Confirmá los datos. Se guardará una variante por cada combinación.</div></div>' +
      '</div>' +
      summary
    nav.innerHTML =
      '<div style="display:flex;justify-content:space-between;gap:10px">' +
        '<button class="btn btn-ghost" onclick="_prevWizardStep=2;renderPrevWizardStep(2)" style="padding:12px 24px;color:var(--gray);border:1px solid var(--border);background:#fff">← Combinaciones</button>' +
        '<button class="btn" onclick="savePreventaProduct()" style="padding:12px 30px;background:var(--green);color:#fff;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(34,197,94,.3)">✓ Guardar preventa</button>' +
      '</div>'
  }
}

function onPrevWizardModel() {
  var model = document.getElementById('pw-model') ? document.getElementById('pw-model').value : ''
  _prevWizardData.modelName = model
}

function uploadWizardImage(input) {
  // Deprecado: la imagen principal ya no se pide (las imágenes vienen por variante)
  void input
}

function addPrevWizardRow() {
  _prevWizardData.rows.push({ color: '', storage: '', price: '', availableFrom: '', imageUrl: '' })
  renderPrevWizardRows()
}

function removePrevWizardRow(i) {
  _prevWizardData.rows.splice(i, 1)
  renderPrevWizardRows()
}

function renderPrevWizardRows() {
  var wrap = document.getElementById('pw-rows-wrap')
  if (!wrap) return
  if (!_prevWizardData.rows.length) {
    wrap.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--gray);border:1px dashed var(--border);border-radius:12px;font-size:12px">Todavía no hay combinaciones. Tocá el botón de abajo para agregar la primera.</div>'
    return
  }
  wrap.innerHTML = _prevWizardData.rows.map(function(r, i) {
    var colorHex = r.color ? (_cssColor ? _cssColor(r.color) : '#ccc') : '#fff'
    var imgPreview = r.imageUrl
      ? '<img src="' + r.imageUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px">'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--gray)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
    return '<div class="prev-row" style="background:var(--cream);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<span style="font-size:11px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.4px">Combinación ' + (i + 1) + '</span>' +
        '<button onclick="removePrevWizardRow(' + i + ')" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:15px">✕</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start">' +
        // Columna izquierda: color (círculo) + imagen
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:5px">Color *</label>' +
            '<div style="display:flex;gap:8px;align-items:center">' +
              '<button onclick="openPrevColorPicker(' + i + ')" title="Elegir color" style="width:40px;height:40px;flex-shrink:0;border:2px solid var(--border);border-radius:50%;background:' + colorHex + ';cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">' +
                (r.color ? '' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>') +
              '</button>' +
              '<input class="inp-f" type="text" id="pw-row-color-' + i + '" value="' + esc(r.color) + '" placeholder="Negro" oninput="updatePrevRow(' + i + ')" style="flex:1;min-width:0">' +
            '</div>' +
          '</div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:5px">Imagen de la variante</label>' +
            '<label class="pw-var-img" ondragover="event.preventDefault();this.style.borderColor=\'var(--orange)\'" ondragleave="this.style.borderColor=\'var(--border)\'" ondrop="event.preventDefault();this.style.borderColor=\'var(--border)\';handlePrevWizardDrop(event,' + i + ')" style="display:flex;align-items:center;justify-content:center;width:72px;height:72px;border:1.5px dashed var(--border);border-radius:10px;background:#fff;cursor:pointer;overflow:hidden;transition:border-color .15s">' +
              '<input type="file" accept="image/*" style="display:none" onchange="uploadPrevWizardImage(this,' + i + ')">' + imgPreview +
            '</label>' +
          '</div>' +
        '</div>' +
        // Columna derecha: storage, precio, fecha
        '<div style="display:flex;flex-direction:column;gap:10px">' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:5px">Almacenamiento *</label><select class="sel-f" id="pw-row-storage-' + i + '" onchange="updatePrevRow(' + i + ')"><option value="">...</option><option value="64 GB"' + (r.storage==='64 GB'?' selected':'') + '>64 GB</option><option value="128 GB"' + (r.storage==='128 GB'?' selected':'') + '>128 GB</option><option value="256 GB"' + (r.storage==='256 GB'?' selected':'') + '>256 GB</option><option value="512 GB"' + (r.storage==='512 GB'?' selected':'') + '>512 GB</option><option value="1 TB"' + (r.storage==='1 TB'?' selected':'') + '>1 TB</option></select></div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:5px">Precio *</label><input class="inp-f" type="number" id="pw-row-price-' + i + '" value="' + r.price + '" placeholder="1320000" oninput="updatePrevRow(' + i + ')"></div>' +
          '<div><label style="font-size:10px;font-weight:600;color:var(--gray);display:block;margin-bottom:5px">Disponible desde *</label><input class="inp-f" type="date" id="pw-row-date-' + i + '" value="' + r.availableFrom + '" onchange="updatePrevRow(' + i + ')"></div>' +
        '</div>' +
      '</div>' +
    '</div>'
  }).join('')
}

function uploadPrevWizardImage(input, i) {
  if (!input.files || !input.files[0]) return
  var fd = new FormData(); fd.append('file', input.files[0])
  var inner = input.parentElement
  if (inner) { inner.innerHTML = '<div style="width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--orange);border-radius:50%;animation:spin .7s linear infinite"></div>' }
  fetch(API_URL + '/api/upload', { method: 'POST', body: fd })
    .then(function(r) { return r.json() })
    .then(function(d) {
      if (d.url && _prevWizardData.rows[i]) {
        _prevWizardData.rows[i].imageUrl = d.url
        renderPrevWizardRows()
      } else if (inner && !(d && d.url)) { inner.innerHTML = '<span style="font-size:10px;color:var(--red)">Error</span>' }
    })
    .catch(function() { if (inner) inner.innerHTML = '<span style="font-size:10px;color:var(--red)">Error</span>' })
}

function handlePrevWizardDrop(e, i) {
  e.preventDefault()
  var f = e.dataTransfer.files && e.dataTransfer.files[0]
  if (f) {
    var fake = { files: [f] }
    uploadPrevWizardImage(fake, i)
  }
}

function updatePrevRow(i) {
  if (!_prevWizardData.rows[i]) return
  var c = document.getElementById('pw-row-color-' + i)
  var s = document.getElementById('pw-row-storage-' + i)
  var p = document.getElementById('pw-row-price-' + i)
  var d = document.getElementById('pw-row-date-' + i)
  if (c) _prevWizardData.rows[i].color = c.value
  if (s) _prevWizardData.rows[i].storage = s.value
  if (p) _prevWizardData.rows[i].price = p.value
  if (d) _prevWizardData.rows[i].availableFrom = d.value
}

var _prevColorPickerTarget = -1

function openPrevColorPicker(i) {
  _prevColorPickerTarget = i
  var host = document.getElementById('prevColorPickerHost')
  if (!host) return
  host.style.display = 'flex'
  var colors = []
  var modelName = document.getElementById('pw-model') ? document.getElementById('pw-model').value : ''
  if (window.MODEL_COLORS && modelName && window.MODEL_COLORS[modelName]) {
    colors = window.MODEL_COLORS[modelName].map(function(c) { return { name: c, hex: (window.COLOR_HEX && window.COLOR_HEX[c]) || '#ccc' } })
  } else {
    colors = (COLOR_PALETTE || []).map(function(c) { return { name: c, hex: _cssColor(c) } })
  }
  host.innerHTML = '<div style="background:#fff;border-radius:16px;padding:20px;max-width:440px;width:100%" onclick="event.stopPropagation()">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<div style="font-size:16px;font-weight:700">Elegir color</div>' +
      '<button onclick="closePrevColorPicker()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--gray)">✕</button>' +
    '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' + colors.map(function(c) {
      return '<div onclick="selectPrevWizardColor(\'' + c.name.replace(/'/g, "\\'") + '\')" style="display:flex;flex-direction:column;align-items:center;gap:4px;width:64px;padding:8px;border:2px solid var(--border);border-radius:12px;background:#fff;cursor:pointer;transition:all .12s" onmouseover="this.style.borderColor=\'var(--orange)\'">' +
        '<div style="width:38px;height:38px;border-radius:50%;background:' + c.hex + ';border:1px solid rgba(0,0,0,.08)"></div>' +
        '<span style="font-size:10px;color:var(--dk);font-weight:600;text-align:center;line-height:1.1">' + esc(c.name) + '</span>' +
      '</div>'
    }).join('') + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:14px">' +
      '<input type="text" id="prevColorCustom" placeholder="Otro color..." style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">' +
      '<button onclick="selectPrevWizardCustom()" style="padding:9px 16px;background:var(--cream2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-weight:600">Usar</button>' +
    '</div>' +
  '</div>'
}

function selectPrevWizardColor(c) {
  if (_prevColorPickerTarget < 0) return
  var input = document.getElementById('pw-row-color-' + _prevColorPickerTarget)
  if (input) input.value = c
  updatePrevRow(_prevColorPickerTarget)
  closePrevColorPicker()
  renderPrevWizardRows()
}

function selectPrevWizardCustom() {
  var inp = document.getElementById('prevColorCustom')
  if (inp && inp.value.trim()) selectPrevWizardColor(inp.value.trim())
}

function closePrevColorPicker() {
  var host = document.getElementById('prevColorPickerHost')
  if (host) host.style.display = 'none'
}

function prevWizardNext() {
  if (_prevWizardStep === 1) {
    var model = document.getElementById('pw-model').value
    if (!model) { showToast('Seleccioná un modelo', 'error'); return }
    _prevWizardData.modelName = model
    // mantener marca/tipo/condicion/imagen
    _prevWizardData.brand = document.getElementById('pw-brand').value
    _prevWizardData.type = document.getElementById('pw-type').value
    _prevWizardData.condition = document.getElementById('pw-condition').value
    _prevWizardData.description = document.getElementById('pw-description').value
    // Pre-llenar una fila vacía si no hay ninguna
    if (!_prevWizardData.rows.length) _prevWizardData.rows.push({ color: '', storage: '', price: '', availableFrom: '', imageUrl: '' })
  }
  renderPrevWizardStep(_prevWizardStep + 1)
}

function renderPrevSummary() {
  // Al llegar al paso 3 los inputs del paso 1 ya no están en el DOM, así que
  // usamos lo guardado en _prevWizardData durante prevWizardNext().
  var model = (_prevWizardData.modelName || (_prevWizardData.model && _prevWizardData.model.name) || (_prevWizardData.resolved && _prevWizardData.resolved.model) || '')
  var brand = (_prevWizardData.brand || 'iPhone')
var type = (_prevWizardData.type || 'celular')
  var cond = (_prevWizardData.condition || 'Nuevo')
  var img = (_prevWizardData.imageUrl || '')
  var desc = (_prevWizardData.description || '')

  // Las filas ya se mantienen actualizadas en vivo por updatePrevRow(), así que
  // en el paso 3 usamos directamente _prevWizardData.rows (los inputs del paso 2
  // ya no existen en el DOM).
  _prevWizardData.resolved = { model: model, brand: brand, type: type, condition: cond, imageUrl: img, description: desc }

  var rows = _prevWizardData.rows || []
  var invalid = rows.filter(function(r) { return !r.color || !r.storage || !r.price || !r.availableFrom })
  var rowsHtml = rows.length ? rows.map(function(r) {
    var dot = '<span style="width:16px;height:16px;border-radius:50%;background:' + (_cssColor ? _cssColor(r.color) : '#ccc') + ';border:1px solid rgba(0,0,0,.1);flex-shrink:0;display:inline-block;vertical-align:middle"></span>'
    var img = r.imageUrl ? '<img src="' + r.imageUrl + '" style="width:28px;height:28px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:6px">' : ''
    return '<div style="display:flex;justify-content:space-between;padding:10px 12px;background:var(--cream2);border-radius:8px;margin-bottom:6px;align-items:center;gap:8px">' +
      '<span style="display:flex;align-items:center;gap:7px;font-weight:600;font-size:13px;min-width:0;overflow:hidden">' + img + dot + ' <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.color) + ' · ' + esc(r.storage) + '</span></span>' +
      '<span style="color:var(--orange);font-weight:700;font-size:13px;flex-shrink:0">' + fmt(parseInt(r.price) || 0) + '</span>' +
      '<span style="font-size:11px;color:var(--blue);flex-shrink:0">Disp. ' + esc(r.availableFrom) + '</span>' +
    '</div>'
  }).join('') : '<div style="color:var(--gray);font-size:12px;padding:8px 0">Sin combinaciones</div>'

  return '<div style="display:grid;gap:14px">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px">' +
        '<div style="font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:6px">Modelo</div>' +
        '<div style="font-size:15px;font-weight:700;color:var(--dk)">' + esc(brand) + ' ' + esc(model) + '</div>' +
        '<div style="font-size:11px;color:var(--gray);margin-top:4px">' + esc(type) + ' · ' + esc(cond) + '</div>' +
      '</div>' +
      '<div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px">' +
        '<div style="font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:6px">Combinaciones</div>' +
        '<div style="font-size:22px;font-weight:700;color:var(--orange)">' + rows.length + '</div>' +
        '<div style="font-size:11px;color:var(--green)" id="pwSummaryValidity">' + (invalid.length ? invalid.length + ' incompletas' : '✓ Completas') + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px">' +
      '<div style="font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;margin-bottom:8px">Detalle</div>' + rowsHtml +
    '</div>' +
  '</div>'
}

function closePreventaModal() {
  renderPreventaCatalogo()
}

function onPrevModelSelect(){
  var model=document.getElementById('prevf-model')?.value
  renderPreventaColorCircles(model, '')
}

function renderPreventaColorCircles(model, currentColor){
  var container=document.getElementById('prevf-colorCircles')
  if(!container)return
  if(!model||!window.MODEL_COLORS||!window.MODEL_COLORS[model]){
    container.innerHTML='<span style="font-size:11px;color:var(--gray)">Selecciona un modelo para ver colores</span>'
    return
  }
  var colors=window.MODEL_COLORS[model]
  var hexMap=window.COLOR_HEX||{}
  var hiddenColor=document.getElementById('prevf-color-hidden')
  if(!hiddenColor)return
  window._preventaColorSelected=currentColor||''
  container.innerHTML=colors.map(function(c){
    var hex=hexMap[c]||'#ccc'
    var sel=c===currentColor
    return '<div onclick="selectPreventaColor(\''+c.replace(/'/g,"\\'")+'\',this)" style="width:32px;height:32px;border-radius:50%;background:'+hex+';cursor:pointer;border:3px solid '+(sel?'var(--orange)':'transparent')+';transition:all .15s;box-shadow:0 2px 6px rgba(0,0,0,.12);flex-shrink:0" title="'+c+'"></div>'
  }).join('')
}

function selectPreventaColor(color, el){
  window._preventaColorSelected=color
  var hidden=document.getElementById('prevf-color-hidden')
  if(hidden)hidden.value=color
  document.querySelectorAll('#prevf-colorCircles div').forEach(function(d){d.style.borderColor='transparent'})
  if(el)el.style.borderColor='var(--orange)'
}

function savePreventaProduct() {
  // Recoger inputs (por si el admin toca y no pasa por el paso 3)
  var model = document.getElementById('pw-model') ? document.getElementById('pw-model').value : (_prevWizardData.modelName || (_prevWizardData.model && _prevWizardData.model.name) || '')
  var brand = document.getElementById('pw-brand') ? document.getElementById('pw-brand').value : (_prevWizardData.brand || 'iPhone')
  var type = document.getElementById('pw-type') ? document.getElementById('pw-type').value : (_prevWizardData.type || 'celular')
  var cond = document.getElementById('pw-condition') ? document.getElementById('pw-condition').value : (_prevWizardData.condition || 'Nuevo')
  var img = document.getElementById('pw-imageUrl') ? document.getElementById('pw-imageUrl').value : (_prevWizardData.imageUrl || '')
  var desc = document.getElementById('pw-description') ? document.getElementById('pw-description').value : (_prevWizardData.description || '')

  // Sincronizar las filas desde los inputs
  if (_prevWizardData.rows) {
    _prevWizardData.rows.forEach(function(r, i) {
      var c = document.getElementById('pw-row-color-' + i)
      var s = document.getElementById('pw-row-storage-' + i)
      var p = document.getElementById('pw-row-price-' + i)
      var d = document.getElementById('pw-row-date-' + i)
      if (c) r.color = c.value
      if (s) r.storage = s.value
      if (p) r.price = p.value
      if (d) r.availableFrom = d.value
    })
  }

  var rows = _prevWizardData.rows || []
  if (!model) { showToast({ title: 'Error', message: 'Seleccioná un modelo', type: 'error' }); return }
  if (!rows.length) { showToast({ title: 'Error', message: 'Agregá al menos una combinación', type: 'error' }); return }
  var invalid = rows.filter(function(r) { return !r.color || !r.storage || !r.price || !r.availableFrom })
  if (invalid.length) { showToast({ title: 'Error', message: 'Completá todas las combinaciones (color, almacenamiento, precio y fecha)', type: 'error' }); return }

  var hdrs = { 'Content-Type': 'application/json' }
  var isEdit = !!(_prevWizardData && _prevWizardData.model && _prevWizardData.model.id)
  var baseId = isEdit ? _prevWizardData.model.id : null

  function buildPayload(r, index) {
    var color = (r.color || '').trim()
    var storage = (r.storage || '').trim()
    var sub = [color, storage].filter(Boolean).join(' · ')
    return {
      name: brand + ' ' + model,
      modelGroup: model,
      brand: brand,
      type: type,
      condition: cond,
      storage: storage || null,
      color: color || null,
      price: parseInt(r.price) || 0,
      cost: 0,
      stock: 0,
      availableFrom: r.availableFrom ? r.availableFrom + 'T00:00:00.000Z' : null,
      imageUrl: r.imageUrl || img || null,
      images: r.imageUrl ? [r.imageUrl] : (img ? [img] : []),
      description: desc || '',
      sub: sub || null,
      isPreorder: true,
      ico: '📱',
    }
  }

  function run(i) {
    if (i >= rows.length) {
      showToast({ title: 'Éxito', message: isEdit ? 'Preventa actualizada' : 'Preventa creada', type: 'success' })
      renderPreventaCatalogo()
      return
    }
    var payload = buildPayload(rows[i], i)
    var url = API_URL + '/api/products'
    var method = 'POST'
    if (isEdit && i === 0 && baseId) { url += '?id=' + baseId; method = 'PUT' }
    fetch(url, { method: method, headers: hdrs, body: JSON.stringify(payload) })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (res.error) { showToast({ title: 'Error', message: res.error, type: 'error' }); return }
        run(i + 1)
      })
      .catch(function() { showToast({ title: 'Error', message: 'Error al guardar preventa', type: 'error' }) })
  }
  run(0)
}

function editPreventaProduct(id) {
  var hdrs = {};
  fetch(API_URL + '/api/products/' + id, { headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(p) {
      if (p && !p.error) openPreventaForm(p)
      else showToast({ title: 'Error', message: 'Producto no encontrado', type: 'error' })
    })
    .catch(function() { showToast({ title: 'Error', message: 'Error al cargar producto', type: 'error' }) })
}

function deletePreventaProduct(id) {
  if (!confirm('Eliminar este producto de preventa?')) return
  var hdrs = {}; 
  fetch(API_URL + '/api/products?id=' + id, { method: 'DELETE', headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (res.error) { showToast({ title: 'Error', message: res.error, type: 'error' }); return }
      showToast({ title: 'Eliminado', message: 'Producto eliminado', type: 'success' })
      loadPreventaProducts()
    })
    .catch(function() { showToast({ title: 'Error', message: 'Error al eliminar', type: 'error' }) })
}

// =========== PREVENTAS ONLINE (customer web orders) ===========

var _onlinePreventaStatusFilter = '';

function renderPreventaOnlineLive() {
  var sub = document.getElementById('preventa-subview')
  if (!sub) return
  _onlinePreventaStatusFilter = ''
  sub.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap;align-items:center">' +
      '<button class="ord-btn ord-btn-act" id="btnOnlineAll" onclick="filterOnlinePreventas(\'\',this)">Todas</button>' +
      '<button class="ord-btn" id="btnOnlinePending" onclick="filterOnlinePreventas(\'PENDING\',this)">Pendientes</button>' +
      '<button class="ord-btn" id="btnOnlineConfirmed" onclick="filterOnlinePreventas(\'CONFIRMED\',this)">Confirmadas</button>' +
      '<button class="ord-btn" id="btnOnlineDelivered" onclick="filterOnlinePreventas(\'DELIVERED\',this)">Entregadas</button>' +
      '<button class="ord-btn" id="btnOnlineCancelled" onclick="filterOnlinePreventas(\'CANCELLED\',this)">Canceladas</button>' +
    '</div>' +
    '<div id="onlinePreventasList"></div>'
  loadOnlinePreventas()
}

function filterOnlinePreventas(status, btn) {
  _onlinePreventaStatusFilter = status
  document.querySelectorAll('#preventa-subview .ord-btn').forEach(function(b) { b.classList.remove('ord-btn-act'); });
  if (btn) btn.classList.add('ord-btn-act')
  loadOnlinePreventas()
}

function loadOnlinePreventas() {
  var list = document.getElementById('onlinePreventasList')
  if (!list) return
  list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray)">Cargando...</div>'
  var url = API_URL + '/api/admin/preorders?source=online&limit=50'
  if (_onlinePreventaStatusFilter) url += '&status=' + _onlinePreventaStatusFilter
  var hdrs = {}; 

  fetch(url, { headers: hdrs })
    .then(function(r) { return r.json(); })
    .then(function(preOrders) {
      if (!Array.isArray(preOrders) || preOrders.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray)"><p style="font-size:40px;margin-bottom:1rem">&#x1F310;</p><p style="font-size:16px;font-weight:600;margin-bottom:8px">No hay preventas online' + (_onlinePreventaStatusFilter ? ' ' + _onlinePreventaStatusFilter : '') + '</p><p style="font-size:13px">Cuando los clientes realicen preventas desde la web, apareceran aqui.</p></div>'
        return
      }
      var statusColors = { PENDING: 'var(--orange)', CONFIRMED: 'var(--green)', DELIVERED: 'var(--gray)', CANCELLED: 'var(--red)' }
      list.innerHTML = preOrders.map(function(po) {
        var productName = po.product ? po.product.name : (po.productModelName || 'Sin nombre')
        var sc = statusColors[po.status] || 'var(--gray)'
        var availableFrom = po.product && po.product.availableFrom ? new Date(po.product.availableFrom).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : null
        var actionsHtml = ''
        if (po.status === 'PENDING') actionsHtml =
          '<button class="admin-btn" style="font-size:10px;justify-content:center;background:var(--green);color:#fff;border:none" onclick="updateOnlinePreventa(\'' + po.id + '\',\'CONFIRMED\')">Confirmar</button>' +
          '<button class="admin-btn" style="font-size:10px;justify-content:center;color:var(--red)" onclick="updateOnlinePreventa(\'' + po.id + '\',\'CANCELLED\')">Cancelar</button>'
        else if (po.status === 'CONFIRMED') actionsHtml =
          '<button class="admin-btn" style="font-size:10px;justify-content:center;background:var(--green);color:#fff;border:none" onclick="updateOnlinePreventa(\'' + po.id + '\',\'DELIVERED\')">Entregar</button>' +
          '<button class="admin-btn" style="font-size:10px;justify-content:center;color:var(--red)" onclick="updateOnlinePreventa(\'' + po.id + '\',\'CANCELLED\')">Cancelar</button>'

        return '<div class="acard" style="padding:1rem">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">' +
            '<div style="font-size:12px;font-weight:700;color:var(--orange)">' + esc(po.code) + '</div>' +
            '<span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:10px;background:' + sc + ';color:#fff">' + po.status + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:12px">' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:14px;font-weight:700;margin-bottom:2px">' + esc(productName) + '</div>' +
              '<div style="font-size:11px;color:var(--gray);margin-bottom:4px">' + esc(po.productStorage || '') + ' · ' + esc(po.productColor || '') + '</div>' +
              '<div style="font-size:11px;margin-bottom:4px">' +
                '<span style="color:var(--gray)">Cliente:</span> ' + esc(po.clientName) + ' · ' + esc(po.clientEmail || '') + ' · ' + esc(po.clientPhone || '') +
              '</div>' +
              (availableFrom ? '<div style="font-size:10px;color:#8B7355;margin-bottom:4px">&#x1F4C5; Disp: ' + availableFrom + '</div>' : '') +
              '<div style="font-size:16px;font-weight:700;margin-top:4px">' + fmt(po.price) + (po.installments > 1 ? ' · ' + po.installments + ' cuotas' : '') + ' · ' + esc(po.paymentMethod || '') + '</div>' +
            '</div>' +
          '</div>' +
          (actionsHtml ? '<div style="display:flex;gap:6px;margin-top:10px">' + actionsHtml + '</div>' : '') +
        '</div>'
      }).join('')
    })
    .catch(function() { list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando preventas online</div>' })
}

function updateOnlinePreventa(id, newStatus) {
  var msg = newStatus === 'DELIVERED' ? 'Marcar como entregada? Esto creara una orden asociada.' : 'Cambiar estado a ' + newStatus + '?'
  if (!confirm(msg)) return
  fetch(API_URL + '/api/admin/preorders/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify({ status: newStatus })
  }).then(function(r) { return r.json(); }).then(function(res) {
    if (res.error) { showToast({ title: 'Error', message: res.error, type: 'error' }); return }
    showToast({ title: 'Actualizado', message: 'Preventa ' + newStatus.toLowerCase(), type: 'success' })
    loadOnlinePreventas()
  }).catch(function() { showToast({ title: 'Error', message: 'Error al actualizar', type: 'error' }) })
}

// =========== PREVENTA ONLINE (legacy placeholder) ===========
function renderPreventaOnline() {
  renderPreventaOnlineLive()
}
window.__preventaLoaded = true;
