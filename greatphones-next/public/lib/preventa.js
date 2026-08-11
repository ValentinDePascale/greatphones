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
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
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
    headers: { 'X-User-Id': currentUser && currentUser.id }
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
  fetch(url, { headers: { 'X-User-Id': currentUser && currentUser.id } })
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
    headers: { 'X-User-Id': currentUser && currentUser.id }
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
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser && currentUser.id },
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

  var hdrs = {}; if (currentUser && currentUser.id) { hdrs['X-User-Id'] = currentUser.id; hdrs['X-Admin-Request'] = '1'; }
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

function openPreventaForm(editData) {
  var sub = document.getElementById('preventa-subview')
  if (!sub) return
  var isEdit = !!editData
  var brands = typeof getUniqueBrands === 'function' ? getUniqueBrands() : ['iPhone','Samsung','MacBook','iPad','Motorola','Xiaomi','Google','Apple']
  var currentBrand = isEdit ? (editData.brand || 'iPhone') : 'iPhone'
  var brandOpts = brands.map(function(b) { return '<option value="' + b + '"' + (b === currentBrand ? ' selected' : '') + '>' + b + '</option>' }).join('')
  var iphoneModels = (window.SELL_MODELS && window.SELL_MODELS['iPhone']) || []
  var currentModel = isEdit ? (editData.modelGroup || editData.name || '') : ''
  var currentColor = isEdit ? (editData.color || '') : ''

  sub.innerHTML =
    '<div style="background:#fff;border-radius:12px;border:1px solid var(--border);padding:1.5rem;max-width:700px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">' +
        '<div style="font-size:18px;font-weight:700;color:var(--dk)">' + (isEdit ? 'Editar producto de preventa' : 'Nuevo producto de preventa') + '</div>' +
        '<button onclick="renderPreventaCatalogo()" style="background:none;border:none;color:var(--gray);cursor:pointer;font-size:14px">← Volver al listado</button>' +
      '</div>' +
      '<div style="display:grid;gap:12px">' +
        '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Modelo *</label><select class="sel-f" id="prevf-model" onchange="onPrevModelSelect()"><option value="">Seleccionar modelo...</option>' + iphoneModels.map(function(m) { return '<option value="' + m + '"' + (m === currentModel ? ' selected' : '') + '>' + m + '</option>' }).join('') + '</select></div>' +
        '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Color</label><div id="prevf-colorCircles" style="display:flex;gap:8px;flex-wrap:wrap;min-height:32px;align-items:center;margin-bottom:4px"></div><input type="hidden" id="prevf-color-hidden" value="' + currentColor + '"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Marca</label><select class="sel-f" id="prevf-brand">' + brandOpts + '</select></div>' +
          '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Tipo</label><select class="sel-f" id="prevf-type"><option value="celular"' + (isEdit && editData.type==='celular'?' selected':'') + '>Celular</option><option value="tablet"' + (isEdit && editData.type==='tablet'?' selected':'') + '>Tablet</option><option value="laptop"' + (isEdit && editData.type==='laptop'?' selected':'') + '>Laptop</option><option value="smartwatch"' + (isEdit && editData.type==='smartwatch'?' selected':'') + '>Smartwatch</option></select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Almacenamiento</label><select class="sel-f" id="prevf-storage"><option value="">Seleccionar...</option><option value="64 GB"' + (isEdit && editData.storage==='64 GB'?' selected':'') + '>64 GB</option><option value="128 GB"' + (isEdit && editData.storage==='128 GB'?' selected':'') + '>128 GB</option><option value="256 GB"' + (isEdit && editData.storage==='256 GB'?' selected':'') + '>256 GB</option><option value="512 GB"' + (isEdit && editData.storage==='512 GB'?' selected':'') + '>512 GB</option><option value="1 TB"' + (isEdit && editData.storage==='1 TB'?' selected':'') + '>1 TB</option></select></div>' +
          '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Condición</label><select class="sel-f" id="prevf-condition"><option value="Nuevo"' + (isEdit && editData.condition==='Nuevo'?' selected':'') + '>Nuevo</option><option value="Impecable"' + (isEdit && editData.condition==='Impecable'?' selected':'') + '>Impecable</option></select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Precio *</label><input class="inp-f" type="number" id="prevf-price" value="' + (isEdit ? (editData.price || '') : '') + '" placeholder="0"></div>' +
          '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">Disponible desde</label><input class="inp-f" type="date" id="prevf-availableFrom" value="' + (isEdit && editData.availableFrom ? new Date(editData.availableFrom).toISOString().split('T')[0] : '') + '"></div>' +
        '</div>' +
        '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px">URL Imagen</label><input class="inp-f" type="text" id="prevf-imageUrl" value="' + (isEdit ? (editData.imageUrl || '') : '') + '" placeholder="https://..."></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:1.25rem;justify-content:flex-end">' +
        '<button class="btn btn-g" onclick="renderPreventaCatalogo()">Cancelar</button>' +
        '<button class="btn btn-o" onclick="savePreventaProduct(\'' + (isEdit ? editData.id : '') + '\')">' + (isEdit ? 'Guardar cambios' : 'Crear preventa') + '</button>' +
      '</div>' +
    '</div>'

  // Render color circles for current model
  if (currentModel) renderPreventaColorCircles(currentModel, currentColor)
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

function savePreventaProduct(id) {
  var isEdit = !!id
  var model=document.getElementById('prevf-model')?.value||''
  var data = {
    name: model,
    modelGroup: model,
    brand: document.getElementById('prevf-brand').value || 'iPhone',
    type: document.getElementById('prevf-type')?.value || 'celular',
    storage: document.getElementById('prevf-storage').value,
    color: document.getElementById('prevf-color-hidden')?.value||window._preventaColorSelected||'',
    condition: document.getElementById('prevf-condition').value || 'Nuevo',
    price: parseInt(document.getElementById('prevf-price').value) || 0,
    availableFrom: document.getElementById('prevf-availableFrom').value || null,
    imageUrl: document.getElementById('prevf-imageUrl').value || null,
    sub: (document.getElementById('prevf-color-hidden')?.value||window._preventaColorSelected||'') + ' ' + (document.getElementById('prevf-storage').value||''),
    isPreorder: true,
    stock: 0,
    cost: 0,
    ico: '📱',
    images: document.getElementById('prevf-imageUrl').value ? [document.getElementById('prevf-imageUrl').value] : []
  }

  if (!data.name) { showToast({ title: 'Error', message: 'Selecciona un modelo', type: 'error' }); return }
  if (!data.price || data.price <= 0) { showToast({ title: 'Error', message: 'El precio es obligatorio', type: 'error' }); return }

  var url = API_URL + '/api/products'
  var method = 'POST'
  if (isEdit) { url += '?id=' + id; method = 'PUT' }

  var hdrs = { 'Content-Type': 'application/json' }
  if (currentUser && currentUser.id) hdrs['X-User-Id'] = currentUser.id

  fetch(url, { method: method, headers: hdrs, body: JSON.stringify(data) })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      if (res.error) { showToast({ title: 'Error', message: res.error, type: 'error' }); return }
      showToast({ title: 'Exito', message: isEdit ? 'Preventa actualizada' : 'Preventa creada', type: 'success' })
      renderPreventaCatalogo()
    })
    .catch(function() { showToast({ title: 'Error', message: 'Error al guardar preventa', type: 'error' }) })
}

function editPreventaProduct(id) {
  var hdrs = {}; if (currentUser && currentUser.id) { hdrs['X-User-Id'] = currentUser.id }
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
  var hdrs = {}; if (currentUser && currentUser.id) hdrs['X-User-Id'] = currentUser.id
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
  var hdrs = {}; if (currentUser && currentUser.id) hdrs['X-User-Id'] = currentUser.id

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
            '<div style="font-size:12px;font-weight:700;color:var(--orange)">' + po.code + '</div>' +
            '<span style="font-size:10px;font-weight:700;padding:2px 10px;border-radius:10px;background:' + sc + ';color:#fff">' + po.status + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:12px">' +
            '<div style="flex:1;min-width:0">' +
              '<div style="font-size:14px;font-weight:700;margin-bottom:2px">' + productName + '</div>' +
              '<div style="font-size:11px;color:var(--gray);margin-bottom:4px">' + (po.productStorage || '') + ' · ' + (po.productColor || '') + '</div>' +
              '<div style="font-size:11px;margin-bottom:4px">' +
                '<span style="color:var(--gray)">Cliente:</span> ' + po.clientName + ' · ' + (po.clientEmail || '') + ' · ' + (po.clientPhone || '') +
              '</div>' +
              (availableFrom ? '<div style="font-size:10px;color:#8B7355;margin-bottom:4px">&#x1F4C5; Disp: ' + availableFrom + '</div>' : '') +
              '<div style="font-size:16px;font-weight:700;margin-top:4px">' + fmt(po.price) + (po.installments > 1 ? ' · ' + po.installments + ' cuotas' : '') + ' · ' + (po.paymentMethod || '') + '</div>' +
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
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser && currentUser.id },
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
