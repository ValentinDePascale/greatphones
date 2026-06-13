// =========== INVENTARIO ADMIN ===========
var invApiUrl = (window.API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin)) + '/api/inventory'

function loadInventoryAdmin(search, page) {
  var list = document.getElementById('invList')
  if (!list) return
  var statusFilter = document.getElementById('invStatusFilter')
  var status = statusFilter ? statusFilter.value : ''
  
  var url = invApiUrl + '?page=' + (page || 1) + '&limit=30'
  if (search) url += '&search=' + encodeURIComponent(search)
  if (status) url += '&status=' + status

  list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray)"><div style="width:24px;height:24px;border:3px solid #e5e5e5;border-top-color:var(--orange);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 8px"></div>Cargando inventario...</div>'

  fetch(url)
    .then(function (r) { return r.json() })
    .then(function (res) {
      var items = res.data || res
      if (!items || items.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray)"><p style="font-size:48px;margin-bottom:1rem">📦</p><p style="font-size:16px;font-weight:600">No hay dispositivos en el inventario</p><p style="font-size:13px">Agregá el primer dispositivo escaneando su IMEI</p></div>'
        return
      }
      list.innerHTML = items.map(function (item) {
        var statusInfo = getInvStatusInfo(item.status)
        return '<div class="adm-item" onclick="openInventoryFicha(\'' + item.id + '\')" style="cursor:pointer">' +
          '<div class="adm-item-img">' +
          (item.imageUrl ? '<img src="' + item.imageUrl + '" style="width:44px;height:44px;object-fit:cover;border-radius:8px">' : '<span style="font-size:24px">📱</span>') +
          '</div>' +
          '<div class="adm-item-info">' +
          '<div class="adm-item-name">' + item.code + ' — ' + item.brand + ' ' + item.modelName + '</div>' +
          '<div class="adm-item-sub">' +
          (item.storage || '') + (item.color ? ' — ' + item.color : '') +
          ' | IMEI: ' + item.imei +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;margin-top:4px">' +
          '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;color:#fff;background:' + statusInfo.color + '">' + statusInfo.label + '</span>' +
          (item.batteryHealth != null ? '<span style="font-size:11px;color:var(--gray)">🔋 ' + item.batteryHealth + '%</span>' : '') +
          '</div>' +
          '</div>' +
          '<div class="adm-item-actions" style="text-align:right">' +
          '<div style="font-size:14px;font-weight:700;color:var(--orange)">$' + (item.targetPrice || 0).toLocaleString('es-AR') + '</div>' +
          '<div style="font-size:11px;color:var(--gray)">Compra: $' + (item.purchasePrice || 0).toLocaleString('es-AR') + '</div>' +
          '</div>' +
          '</div>'
      }).join('')
      
      if (res.totalPages > 1) {
        var pag = document.getElementById('invPagination')
        if (pag) renderPagination('invList', res.page, res.totalPages, function (p) { loadInventoryAdmin(search, p) })
      }
    })
    .catch(function (e) {
      list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--red)">Error cargando inventario: ' + e.message + '</div>'
    })
}

function getInvStatusInfo(status) {
  var map = {
    IN_STOCK: { label: 'En stock', color: '#22c55e' },
    IN_REPAIR: { label: 'En reparación', color: '#f59e0b' },
    RESERVED: { label: 'Reservado', color: '#3b82f6' },
    ON_HOLD: { label: 'En espera', color: '#8b5cf6' },
    SOLD: { label: 'Vendido', color: '#ef4444' },
  }
  return map[status] || { label: status || 'Desconocido', color: '#6b7280' }
}

// =========== MODAL: AGREGAR DISPOSITIVO ===========
var _invLookupData = null

function showAddInventoryModal() {
  _invLookupData = null
  var html =
    '<div id="invModalOverlay" style="position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px">' +
    '<div style="background:#fff;border-radius:20px;width:min(520px,100%);max-height:90vh;overflow-y:auto;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
    '<h2 style="font-size:20px;font-weight:700;margin:0;font-family:\'Playfair Display\',Georgia,serif">Agregar dispositivo</h2>' +
    '<button onclick="closeInvModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--gray)">✕</button>' +
    '</div>' +

    // Step 1: IMEI
    '<div id="invStepImei">' +
    '<div style="margin-bottom:16px">' +
    '<label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;color:var(--dk)">IMEI del dispositivo</label>' +
    '<div style="display:flex;gap:8px">' +
    '<input type="text" id="invImeiInput" placeholder="Ingresá o escaneá el IMEI (15 dígitos)" maxlength="15" oninput="this.value=this.value.replace(/[^0-9]/g,\'\')" style="flex:1;padding:10px 14px;border:2px solid var(--border);border-radius:10px;font-size:14px;outline:none" onfocus="this.style.borderColor=\'var(--orange)\'" onblur="this.style.borderColor=\'var(--border)\'">' +
    '<button onclick="lookupImei()" class="btn btn-o" style="padding:10px 20px;white-space:nowrap">🔍 Buscar</button>' +
    '</div>' +
    '<div style="margin-top:8px;font-size:12px;color:var(--gray)">O escaneá desde la cámara:</div>' +
    '<button onclick="alert(\'Escáner de cámara próximamente\')" style="margin-top:4px;padding:8px 16px;background:var(--cream2);border:1px dashed var(--border);border-radius:8px;font-size:12px;cursor:pointer">📷 Abrir cámara</button>' +
    '</div>' +

    // Auto-completed fields
    '<div id="invLookupResult" style="display:none">' +
    '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:16px">' +
    '<div style="font-size:12px;font-weight:600;color:#16a34a;margin-bottom:8px">✅ Dispositivo identificado</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">' +
    '<div><span style="color:var(--gray)">Marca:</span> <strong id="invLookupBrand"></strong></div>' +
    '<div><span style="color:var(--gray)">Modelo:</span> <strong id="invLookupModel"></strong></div>' +
    '<div><span style="color:var(--gray)">Capacidad:</span> <strong id="invLookupStorage"></strong></div>' +
    '<div><span style="color:var(--gray)">Color:</span> <strong id="invLookupColor"></strong></div>' +
    '<div><span style="color:var(--gray)">N° Modelo:</span> <strong id="invLookupModelNumber"></strong></div>' +
    '<div><span style="color:var(--gray)">Tipo:</span> <strong id="invLookupType"></strong></div>' +
    '</div>' +
    '</div>' +
    '</div>' +

    // Manual fields
    '<div id="invManualFields" style="display:none">' +
    '<div style="margin-bottom:16px">' +
    '<h3 style="font-size:14px;font-weight:600;margin:0 0 12px 0;color:var(--dk)">Datos del negocio</h3>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
    '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px;color:var(--gray)">Precio de compra *</label><input type="text" id="invPurchasePrice" placeholder="$ 0" class="inp-f" oninput="formatPriceInput(this)"></div>' +
    '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px;color:var(--gray)">Precio target de venta</label><input type="text" id="invTargetPrice" placeholder="$ 0" class="inp-f" oninput="formatPriceInput(this)"></div>' +
    '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px;color:var(--gray)">Condición estética</label><select id="invCosmeticCondition" class="sel-f"><option value="Nuevo">Nuevo</option><option value="Impecable">Impecable</option><option value="Muy bueno">Muy bueno</option><option value="Bueno">Bueno</option></select></div>' +
    '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px;color:var(--gray)">Condición funcional</label><select id="invFunctionalCondition" class="sel-f"><option value="">Seleccionar...</option><option value="Excelente">Excelente</option><option value="Buena">Buena</option><option value="Con detalles">Con detalles</option></select></div>' +
    '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px;color:var(--gray)">Batería (%)</label><input type="number" id="invBattery" min="0" max="100" placeholder="92" class="inp-f"></div>' +
    '<div><label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px;color:var(--gray)">Inversor</label><input type="text" id="invInvestor" placeholder="Nombre del inversor" class="inp-f"></div>' +
    '</div>' +
    '<div style="margin-top:12px">' +
    '<label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px;color:var(--gray)">Proveedor</label>' +
    '<div style="display:flex;gap:8px">' +
    '<select id="invSupplier" class="sel-f" style="flex:1"><option value="">Seleccionar proveedor...</option></select>' +
    '</div>' +
    '</div>' +
    '<div style="margin-top:12px">' +
    '<label style="font-size:11px;font-weight:500;display:block;margin-bottom:4px;color:var(--gray)">Observaciones</label>' +
    '<textarea id="invNotes" class="inp-f" placeholder="Estado del equipo, accesorios incluidos, etc." style="height:60px;resize:none"></textarea>' +
    '</div>' +
    '</div>' +

    // Buttons
    '<div style="display:flex;gap:12px;margin-top:20px">' +
    '<button id="invSaveBtn" class="btn btn-o" onclick="saveInventoryItem()" style="flex:1">💾 Guardar dispositivo</button>' +
    '<button class="btn btn-g" onclick="closeInvModal()">Cancelar</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>'

  var overlay = document.createElement('div')
  overlay.id = 'invModalWrapper'
  overlay.innerHTML = html
  document.body.appendChild(overlay)

  loadSuppliersForInventory()
}

function closeInvModal() {
  var el = document.getElementById('invModalWrapper')
  if (el) el.remove()
}

function loadSuppliersForInventory() {
  var select = document.getElementById('invSupplier')
  if (!select) return
  var apiUrl = window.API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin)
  fetch(apiUrl + '/api/products') // we'll fetch from a suppliers endpoint eventually
    .then(function (r) { return r.json() })
    .catch(function () { return { data: [] } })
}

function lookupImei() {
  var input = document.getElementById('invImeiInput')
  var imei = input ? input.value.trim() : ''
  if (!imei || imei.length !== 15) {
    alert('Ingresá un IMEI válido de 15 dígitos')
    return
  }

  var lookupResult = document.getElementById('invLookupResult')
  var manualFields = document.getElementById('invManualFields')
  var btn = document.querySelector('#invModalWrapper button[onclick*="lookupImei"]')
  if (btn) btn.textContent = '⏳ Buscando...'

  var apiUrl = window.API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin)
  fetch(apiUrl + '/api/inventory/lookup-imei', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imei: imei })
  })
    .then(function (r) { return r.json() })
    .then(function (data) {
      if (btn) btn.textContent = '🔍 Buscar'
      _invLookupData = data

      if (data.brand) {
        document.getElementById('invLookupBrand').textContent = data.brand
        document.getElementById('invLookupModel').textContent = data.modelName || '—'
        document.getElementById('invLookupStorage').textContent = data.storage || '—'
        document.getElementById('invLookupColor').textContent = data.color || '—'
        document.getElementById('invLookupModelNumber').textContent = data.modelNumber || '—'
        document.getElementById('invLookupType').textContent = data.deviceType || 'celular'
        lookupResult.style.display = 'block'
      } else {
        lookupResult.style.display = 'none'
        if (data.warning) alert(data.warning)
      }
      manualFields.style.display = 'block'
    })
    .catch(function (e) {
      if (btn) btn.textContent = '🔍 Buscar'
      alert('Error al consultar IMEI: ' + e.message)
      manualFields.style.display = 'block'
    })
}

function saveInventoryItem() {
  var imei = document.getElementById('invImeiInput').value.trim()
  if (!imei || imei.length !== 15) {
    alert('Ingresá un IMEI válido de 15 dígitos')
    return
  }

  var purchasePrice = parseInt(document.getElementById('invPurchasePrice').value.replace(/[^0-9]/g, '')) || 0
  if (!purchasePrice) {
    alert('El precio de compra es requerido')
    return
  }

  var btn = document.getElementById('invSaveBtn')
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Guardando...' }

  var data = {
    imei: imei,
    brand: _invLookupData?.brand || '',
    modelName: _invLookupData?.modelName || '',
    storage: _invLookupData?.storage || '',
    color: _invLookupData?.color || '',
    modelNumber: _invLookupData?.modelNumber || '',
    deviceType: _invLookupData?.deviceType || 'celular',
    imageUrl: _invLookupData?.imageUrl || '',
    purchasePrice: purchasePrice,
    targetPrice: parseInt(document.getElementById('invTargetPrice').value.replace(/[^0-9]/g, '')) || 0,
    cosmeticCondition: document.getElementById('invCosmeticCondition').value || 'Impecable',
    functionalCondition: document.getElementById('invFunctionalCondition').value || '',
    batteryHealth: parseInt(document.getElementById('invBattery').value) || null,
    investor: document.getElementById('invInvestor').value.trim() || '',
    supplierId: document.getElementById('invSupplier').value || '',
    notes: document.getElementById('invNotes').value.trim() || '',
    createdById: localStorage.getItem('gp_v1_user') ? JSON.parse(localStorage.getItem('gp_v1_user')).id : 'unknown',
  }

  var apiUrl = window.API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin)
  fetch(apiUrl + '/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(function (r) {
      if (!r.ok) throw new Error('Error ' + r.status)
      return r.json()
    })
    .then(function (result) {
      closeInvModal()
      showSuccessToast('Dispositivo agregado', result.code + ' — ' + result.brand + ' ' + result.modelName)
      loadInventoryAdmin()
    })
    .catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = '💾 Guardar dispositivo' }
      alert('Error al guardar: ' + e.message)
    })
}

// =========== FICHA DEL DISPOSITIVO (en admin panel) ===========
function openInventoryFicha(id) {
  // Navigate to the Next.js page
  // Since we're in the SPA, we open in a new context
  // Find the code first
  var apiUrl = window.API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin)
  fetch(apiUrl + '/api/inventory/' + id)
    .then(function (r) { return r.json() })
    .then(function (item) {
      if (item && item.code) {
        window.open('/inv/' + item.code, '_blank')
      }
    })
    .catch(function () {
      alert('Error al abrir la ficha del dispositivo')
    })
}
