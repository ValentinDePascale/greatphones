// =========== IN-STORE SALES (REDESIGNED POS) ===========
var instoreState = {
  items: [],
  paymentMethod: null,
  cashReceived: 0,
  searchQuery: '',
  searchResults: [],
  customModal: null,
  invDevice: null  // scanned/looked-up inventory device
}

function renderInStoreSale() {
  var content = document.getElementById('adminContent')
  if (!content) return

  content.innerHTML = `
    <style>
      .pos-layout{display:grid;grid-template-columns:1fr 380px;gap:1.5rem;height:calc(100vh - 140px);min-height:600px}
      .pos-inv-result{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:12px 16px;margin-bottom:8px}
      .pos-inv-result .remove{float:right;background:none;border:none;color:#ef4444;cursor:pointer;font-size:18px;padding:0 4px}
      .pos-inv-result .remove:hover{color:#dc2626}
      @media(max-width:900px){
        .pos-layout{grid-template-columns:1fr;height:auto;min-height:auto}
        .pos-right{position:static!important}
      }
    </style>
    <div class="pos-layout">
      
      <!-- LEFT COLUMN: Product Selection -->
      <div style="display:flex;flex-direction:column;gap:1rem;overflow:hidden">
        
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <h2 style="font-size:24px;font-weight:700;color:var(--dk)">Nueva Venta</h2>
          <button onclick="loadInStoreHistory()" class="btn btn-o" style="padding:8px 16px">
            <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">history</span>
            Historial
          </button>
        </div>

        <!-- Client Info (compact) -->
        <div style="background:var(--cream2);padding:1rem;border-radius:12px;border:1px solid var(--border)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px">Cliente</label>
              <input type="text" id="instore-clientName" placeholder="Nombre completo" 
                style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px">DNI</label>
              <input type="text" id="instore-clientDni" placeholder="12345678" 
                style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px;box-sizing:border-box">
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div style="position:relative">
          <input type="text" id="instore-search" placeholder="Buscar productos o accesorios... (Ctrl+K)" 
            oninput="handleInstoreSearch(this.value)"
            style="width:100%;padding:12px 16px 12px 44px;border:2px solid var(--border);border-radius:12px;font-size:14px;transition:border-color .2s;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--orange)'"
            onblur="this.style.borderColor='var(--border)'">
          <span class="material-symbols-outlined" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--gray);font-size:20px">search</span>
        </div>

        <!-- Search Results -->
        <div id="instore-searchResults" style="flex:1;overflow-y:auto;display:none"></div>

        <!-- Inventory Device Scanner -->
        <div style="background:var(--cream2);padding:0.75rem 1rem;border-radius:12px;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:var(--orange)">qr_code_scanner</span>
            <span style="font-size:13px;font-weight:600;color:var(--dk)">Agregar dispositivo de inventario</span>
          </div>
          <div style="display:flex;gap:8px">
            <input type="text" id="instore-invImei" placeholder="Escaneá QR o ingresá IMEI" maxlength="15"
              oninput="this.value=this.value.replace(/[^0-9]/g,'')"
              style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box">
            <button onclick="lookupInventoryDevice()" class="btn btn-o" style="padding:8px 12px;white-space:nowrap;font-size:12px">
              <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">search</span>
            </button>
            <button onclick="openCameraScanner()" class="btn btn-o" style="padding:8px 12px;white-space:nowrap;font-size:12px" title="Escanear QR con cámara">
              <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">photo_camera</span>
            </button>
          </div>
          <div id="instore-invResult"></div>
        </div>

        <!-- Items List -->
        <div style="flex:1;overflow-y:auto;background:var(--cream2);border-radius:12px;border:1px solid var(--border);padding:1rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:8px">
            <h3 style="font-size:16px;font-weight:700">Items (${instoreState.items.length})</h3>
            <button onclick="openCustomProductModal()" class="btn btn-o" style="padding:6px 12px;font-size:12px">
              + Producto custom
            </button>
          </div>
          <div id="instore-itemsList"></div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Sticky Summary -->
      <div class="pos-right" style="position:sticky;top:0;height:fit-content">
        <div style="background:var(--cream2);border-radius:12px;border:1px solid var(--border);padding:1.5rem;box-shadow:0 4px 20px rgba(0,0,0,.08)">
          
          <!-- Payment Method -->
          <div style="margin-bottom:1.5rem">
            <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.75rem">Método de Pago</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
              <button onclick="selectPaymentMethod('cash')" id="btn-cash" 
                style="padding:12px;border:2px solid var(--border);border-radius:10px;background:white;cursor:pointer;transition:all .2s">
                <div style="font-size:20px;margin-bottom:4px">💵</div>
                <div style="font-size:12px;font-weight:600">Efectivo</div>
              </button>
              <button onclick="selectPaymentMethod('transfer')" id="btn-transfer"
                style="padding:12px;border:2px solid var(--border);border-radius:10px;background:white;cursor:pointer;transition:all .2s">
                <div style="font-size:20px;margin-bottom:4px">📲</div>
                <div style="font-size:12px;font-weight:600">Transferencia</div>
              </button>
            </div>
          </div>

          <!-- Totals -->
          <div style="border-top:1px solid var(--border);padding-top:1rem;margin-bottom:1rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;font-size:13px">
              <span style="color:var(--gray)">Subtotal</span>
              <span id="instore-subtotal" style="font-weight:600">$0</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:800;color:var(--dk);margin-top:0.75rem">
              <span>Total</span>
              <span id="instore-total" style="color:var(--orange)">$0</span>
            </div>
          </div>

          <!-- Cash Section -->
          <div id="instore-cashSection" style="display:none;border-top:1px solid var(--border);padding-top:1rem;margin-bottom:1rem">
            <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">Monto Recibido</label>
            <input type="number" id="instore-cashReceived" placeholder="0" 
              oninput="calculateChange()"
              style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:0.5rem;box-sizing:border-box">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(45,90,39,.1);border-radius:8px">
              <span style="font-size:12px;font-weight:600;color:var(--green)">Cambio</span>
              <span id="instore-change" style="font-size:16px;font-weight:700;color:var(--green)">$0</span>
            </div>
          </div>

          <!-- Confirm Button -->
          <button onclick="confirmInStoreSale()" class="btn btn-primary" 
            style="width:100%;padding:14px;font-size:14px;font-weight:700;margin-top:1rem">
            Confirmar Venta
          </button>

          <!-- Quick Actions -->
          <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);display:flex;gap:0.5rem">
            <button onclick="clearInstoreSale()" class="btn btn-o" style="flex:1;padding:8px;font-size:11px">
              Limpiar
            </button>
            <button onclick="loadInStoreHistory()" class="btn btn-o" style="flex:1;padding:8px;font-size:11px">
              Ver Historial
            </button>
          </div>
        </div>
      </div>
    </div>
  `

  renderItemsList()
  updateSummary()
}

// =========== INVENTORY DEVICE LOOKUP ===========
var scannedInvDevice = null  // temporary storage for scanned/looked-up device

function lookupInventoryDevice() {
  var imei = document.getElementById('instore-invImei').value.trim()
  if (!imei || imei.length < 10) { showToast('Ingresá un IMEI válido (15 dígitos)', 'error'); return }

  showToast('Buscando dispositivo...', 'info')
  fetch(API_URL + '/api/inventory?imei=' + encodeURIComponent(imei))
    .then(r => r.json())
    .then(res => {
      var items = res.data || []
      if (items.length === 0) {
        showToast('No se encontró un dispositivo con ese IMEI en el inventario', 'error')
        return
      }
      var device = items[0]
      if (device.status !== 'IN_STOCK') {
        showToast('El dispositivo ya fue vendido o está en otro estado', 'error')
        return
      }
      showInvDeviceResult(device)
    })
    .catch(err => {
      console.error('Error looking up device:', err)
      showToast('Error al buscar dispositivo', 'error')
    })
}

function showInvDeviceResult(device) {
  scannedInvDevice = device
  var container = document.getElementById('instore-invResult')
  if (!container) return

  container.innerHTML = `
    <div class="pos-inv-result" style="margin-top:8px">
      <button class="remove" onclick="clearInvDevice()">✕</button>
      <div style="font-size:12px;font-weight:600;color:#16a34a;margin-bottom:4px">✅ ${device.brand} ${device.modelName}</div>
      <div style="font-size:11px;color:var(--gray)">
        ${[device.storage, device.color].filter(Boolean).join(' — ')} · ${device.imei} · <strong>$${(device.targetPrice || device.purchasePrice).toLocaleString('es-AR')}</strong>
      </div>
      <button onclick="addInvDeviceToSale()" class="btn btn-primary" style="margin-top:8px;padding:6px 14px;font-size:11px;width:100%">
        + Agregar a la venta
      </button>
    </div>
  `
}

function clearInvDevice() {
  scannedInvDevice = null
  var container = document.getElementById('instore-invResult')
  if (container) container.innerHTML = ''
  document.getElementById('instore-invImei').value = ''
}

function addInvDeviceToSale() {
  if (!scannedInvDevice) { showToast('No hay dispositivo seleccionado', 'error'); return }

  var device = scannedInvDevice
  var price = device.targetPrice || device.purchasePrice

  // Check if already in cart
  var existing = instoreState.items.find(i => i.inventoryItemId === device.id)
  if (existing) {
    showToast('Este dispositivo ya está en la venta', 'warning')
    return
  }

  instoreState.items.push({
    type: 'inventory',
    inventoryItemId: device.id,
    code: device.code,
    imei: device.imei,
    name: device.brand + ' ' + device.modelName,
    brand: device.brand,
    modelName: device.modelName,
    storage: device.storage,
    color: device.color,
    price: price,
    quantity: 1,
    imageUrl: device.imageUrl
  })

  clearInvDevice()
  renderItemsList()
  updateSummary()
  showToast(`${device.brand} ${device.modelName} agregado`, 'success')
}

// =========== QR CAMERA SCANNER ===========
function openCameraScanner() {
  if (typeof window.abrirScannerQR !== 'function') {
    // Fallback if render.js hasn't loaded yet
    showToast('Cargando escáner...', 'info')
    return
  }
  window.abrirScannerQR({
    onDetected: function(res) {
      if (res.type === 'code') {
        lookupInvByCode(res.code)
      } else if (res.type === 'imei') {
        document.getElementById('instore-invImei').value = res.imei
        lookupInventoryDevice()
      }
    }
  })
}

function lookupInvByCode(code) {
  showToast('Buscando dispositivo...', 'info')
  fetch(API_URL + '/api/inventory?code=' + encodeURIComponent(code))
    .then(r => r.json())
    .then(res => {
      var items = res.data || []
      if (items.length === 0) {
        showToast('No se encontró dispositivo con ese código', 'error')
        return
      }
      var device = items[0]
      if (device.status !== 'IN_STOCK') {
        showToast('El dispositivo ya no está disponible', 'error')
        return
      }
      showInvDeviceResult(device)
    })
    .catch(err => {
      console.error('Error looking up by code:', err)
      showToast('Error al buscar dispositivo', 'error')
    })
}

// =========== SEARCH ===========
function handleInstoreSearch(query) {
  instoreState.searchQuery = query
  
  if (!query || query.length < 2) {
    document.getElementById('instore-searchResults').style.display = 'none'
    return
  }

  // Search both products and accessories
  Promise.all([
    fetch(API_URL + '/api/products?search=' + encodeURIComponent(query) + '&limit=8').then(r => r.json()),
    fetch(API_URL + '/api/accessories?search=' + encodeURIComponent(query) + '&limit=8').then(r => r.json())
  ]).then(([prodRes, accRes]) => {
    var products = (prodRes.data || []).map(p => ({...p, itemType: 'producto'}))
    var accessories = (accRes.data || []).map(a => ({...a, itemType: 'accesorio'}))
    var results = products.concat(accessories)
    
    instoreState.searchResults = results
    renderSearchResults(results)
  }).catch(err => console.error('Search error:', err))
}

function renderSearchResults(results) {
  var container = document.getElementById('instore-searchResults')
  if (!container) return

  if (results.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray)"><p>No se encontraron productos</p></div>'
    container.style.display = 'block'
    return
  }

  container.innerHTML = results.map(item => {
    var isInCart = instoreState.items.find(i => i.productId === item.id || i.id === item.id)
    var stockLow = item.stock <= 2
    
    return `
      <div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:white;border-radius:10px;margin-bottom:0.5rem;border:1px solid ${isInCart ? 'var(--orange)' : 'var(--border)'};cursor:pointer;transition:all .2s"
        onclick="addFromSearch('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price}, ${item.stock}, '${item.itemType}', '${item.imageUrl || ''}')"
        onmouseover="this.style.transform='translateX(4px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'"
        onmouseout="this.style.transform='none';this.style.boxShadow='none'">
        
        <div style="width:60px;height:60px;border-radius:8px;background:var(--cream2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
          ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%;height:100%;object-fit:cover">` : '<span style="font-size:24px">📱</span>'}
        </div>
        
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
          <div style="font-size:11px;color:var(--gray)">${item.brand || item.category} · ${item.itemType}</div>
          <div style="font-size:11px;color:${stockLow ? 'var(--red)' : 'var(--gray)'};margin-top:2px">
            ${stockLow ? '⚠ Stock bajo' : 'Stock: ' + item.stock}
          </div>
        </div>
        
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:16px;font-weight:700;color:var(--orange)">$${item.price.toLocaleString('es-AR')}</div>
          ${isInCart ? '<div style="font-size:10px;color:var(--orange);font-weight:600;margin-top:2px">✓ En carrito</div>' : ''}
        </div>
      </div>
    `
  }).join('')

  container.style.display = 'block'
}

function addFromSearch(id, name, price, stock, itemType, imageUrl) {
  // Check if already in cart
  var existing = instoreState.items.find(i => i.productId === id)
  if (existing) {
    // Increment quantity
    if (existing.quantity < stock) {
      existing.quantity++
      showToast(`${name} - Cantidad actualizada`, 'success')
    } else {
      showToast('Stock máximo alcanzado', 'warning')
      return
    }
  } else {
    instoreState.items.push({
      type: 'catalog',
      productId: id,
      name: name,
      price: price,
      quantity: 1,
      stock: stock,
      imageUrl: imageUrl,
      itemType: itemType
    })
    showToast(`${name} agregado`, 'success')
  }

  renderItemsList()
  updateSummary()
  
  // Clear search
  document.getElementById('instore-search').value = ''
  document.getElementById('instore-searchResults').style.display = 'none'
  instoreState.searchQuery = ''
}

function openCustomProductModal() {
  var modal = document.createElement('div')
  modal.id = 'customProductModal'
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem'
  
  modal.innerHTML = `
    <div style="background:var(--cream2);border-radius:16px;max-width:400px;width:100%;padding:2rem">
      <h3 style="margin-bottom:1.5rem;font-size:18px;font-weight:700">Producto Fuera del Catálogo</h3>
      
      <div style="margin-bottom:1rem">
        <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">Nombre</label>
        <input type="text" id="customName" placeholder="Ej: Funda personalizada" 
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;box-sizing:border-box">
      </div>
      
      <div style="margin-bottom:1rem">
        <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">Precio</label>
        <input type="number" id="customPrice" placeholder="0" 
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;box-sizing:border-box">
      </div>
      
      <div style="margin-bottom:1.5rem">
        <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">Cantidad</label>
        <input type="number" id="customQuantity" placeholder="1" value="1" min="1"
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;box-sizing:border-box">
      </div>
      
      <div style="display:flex;gap:0.75rem">
        <button onclick="closeCustomProductModal()" class="btn btn-o" style="flex:1">Cancelar</button>
        <button onclick="addCustomProduct()" class="btn btn-primary" style="flex:1">Agregar</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  setTimeout(() => document.getElementById('customName').focus(), 100)
}

function closeCustomProductModal() {
  var modal = document.getElementById('customProductModal')
  if (modal) modal.remove()
}

function addCustomProduct() {
  var name = document.getElementById('customName').value.trim()
  var price = parseInt(document.getElementById('customPrice').value)
  var quantity = parseInt(document.getElementById('customQuantity').value) || 1
  
  if (!name) {
    showToast('Nombre requerido', 'error')
    return
  }
  if (!price || price <= 0) {
    showToast('Precio inválido', 'error')
    return
  }
  
  instoreState.items.push({
    type: 'custom',
    name: name,
    price: price,
    quantity: quantity
  })
  
  closeCustomProductModal()
  renderItemsList()
  updateSummary()
  showToast('Producto custom agregado', 'success')
}

function renderItemsList() {
  var list = document.getElementById('instore-itemsList')
  if (!list) return

  if (instoreState.items.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray)"><div style="font-size:48px;margin-bottom:1rem">🛒</div><p style="font-size:13px">Agregá productos para comenzar</p></div>'
    return
  }

  list.innerHTML = instoreState.items.map((item, i) => {
    var isInventory = item.type === 'inventory'
    return `
    <div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:white;border-radius:10px;margin-bottom:0.5rem;border:1px solid ${isInventory ? 'var(--orange)' : 'var(--border)'}">
      ${item.imageUrl ? `
        <div style="width:50px;height:50px;border-radius:8px;background:var(--cream2);overflow:hidden;flex-shrink:0">
          <img src="${item.imageUrl}" style="width:100%;height:100%;object-fit:cover">
        </div>
      ` : `
        <div style="width:50px;height:50px;border-radius:8px;background:var(--cream2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:20px">${isInventory ? '📱' : (item.itemType === 'accesorio' ? '📦' : '📱')}</span>
        </div>
      `}
      
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
        <div style="font-size:11px;color:var(--gray)">
          ${isInventory ? `${item.storage ? item.storage + ' · ' : ''}${item.color ? item.color + ' · ' : ''}${item.code}` : '$' + item.price.toLocaleString('es-AR') + ' c/u'}
        </div>
        ${isInventory ? `<div style="font-size:10px;color:var(--orange);font-weight:600;margin-top:2px">📋 ${item.code} · ${item.imei}</div>` : ''}
      </div>
      
      ${!isInventory ? `
      <div style="display:flex;align-items:center;gap:0.5rem">
        <button onclick="updateItemQuantity(${i}, -1)" 
          style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:16px;font-weight:600"
          onmouseover="this.style.background='var(--cream3)'"
          onmouseout="this.style.background='white'">−</button>
        <span style="min-width:32px;text-align:center;font-weight:700;font-size:14px">${item.quantity}</span>
        <button onclick="updateItemQuantity(${i}, 1)" 
          style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:16px;font-weight:600"
          onmouseover="this.style.background='var(--cream3)'"
          onmouseout="this.style.background='white'">+</button>
      </div>
      ` : '<div style="min-width:60px;text-align:center"><span style="font-size:10px;color:var(--gray)">1 unidad</span></div>'}
      
      <div style="min-width:100px;text-align:right;font-weight:700;font-size:14px;color:var(--dk)">
        $${(item.price * (item.quantity || 1)).toLocaleString('es-AR')}
      </div>
      
      <button onclick="removeItem(${i})" 
        style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(239,68,68,.1);color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0"
        onmouseover="this.style.background='var(--red)';this.style.color='white'"
        onmouseout="this.style.background='rgba(239,68,68,.1)';this.style.color='var(--red)'">
        <span class="material-symbols-outlined" style="font-size:16px">delete</span>
      </button>
    </div>`
  }).join('')
}

function updateItemQuantity(index, delta) {
  var item = instoreState.items[index]
  
  // Inventory items can only have quantity 1
  if (item.type === 'inventory') return

  var newQty = item.quantity + delta

  if (item.type === 'catalog' && newQty > item.stock) {
    showToast('Stock máximo alcanzado', 'warning')
    return
  }

  if (newQty < 1) {
    removeItem(index)
    return
  }

  item.quantity = newQty
  renderItemsList()
  updateSummary()
}

function removeItem(index) {
  var item = instoreState.items[index]
  instoreState.items.splice(index, 1)
  renderItemsList()
  updateSummary()
  showToast(`${item.name} eliminado`, 'info')
}

function selectPaymentMethod(method) {
  instoreState.paymentMethod = method

  var cashBtn = document.getElementById('btn-cash')
  var transferBtn = document.getElementById('btn-transfer')
  
  if (method === 'cash') {
    cashBtn.style.borderColor = 'var(--green)'
    cashBtn.style.background = 'rgba(45,90,39,.1)'
    transferBtn.style.borderColor = 'var(--border)'
    transferBtn.style.background = 'white'
  } else {
    transferBtn.style.borderColor = 'var(--green)'
    transferBtn.style.background = 'rgba(45,90,39,.1)'
    cashBtn.style.borderColor = 'var(--border)'
    cashBtn.style.background = 'white'
  }

  document.getElementById('instore-cashSection').style.display = method === 'cash' ? 'block' : 'none'

  if (method === 'cash') {
    calculateChange()
  }
}

function calculateChange() {
  var cashReceived = parseInt(document.getElementById('instore-cashReceived').value) || 0
  var total = instoreState.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  var change = cashReceived - total

  var changeEl = document.getElementById('instore-change')
  changeEl.textContent = '$' + change.toLocaleString('es-AR')
  changeEl.style.color = change >= 0 ? 'var(--green)' : 'var(--red)'
}

function updateSummary() {
  var subtotal = instoreState.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

  document.getElementById('instore-subtotal').textContent = '$' + subtotal.toLocaleString('es-AR')
  document.getElementById('instore-total').textContent = '$' + subtotal.toLocaleString('es-AR')

  if (instoreState.paymentMethod === 'cash') {
    calculateChange()
  }
}

function clearInstoreSale() {
  if (instoreState.items.length === 0 && !instoreState.paymentMethod) return
  
  if (confirm('¿Limpiar toda la venta?')) {
    instoreState = {
      items: [],
      paymentMethod: null,
      cashReceived: 0,
      searchQuery: '',
      searchResults: [],
      customModal: null,
      invDevice: null
    }
    scannedInvDevice = null
    renderInStoreSale()
    showToast('Venta limpiada', 'info')
  }
}

function confirmInStoreSale() {
  var clientName = document.getElementById('instore-clientName').value.trim()
  var clientDni = document.getElementById('instore-clientDni').value.trim()

  if (!clientName || !clientDni) {
    showToast('Completá nombre y DNI del cliente', 'error')
    return
  }

  if (instoreState.items.length === 0) {
    showToast('Agregá al menos un producto', 'error')
    return
  }

  if (!instoreState.paymentMethod) {
    showToast('Seleccioná un método de pago', 'error')
    return
  }

  var total = instoreState.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

  if (instoreState.paymentMethod === 'cash') {
    var cashReceived = parseInt(document.getElementById('instore-cashReceived').value) || 0
    if (cashReceived < total) {
      showToast('Monto recibido insuficiente', 'error')
      return
    }
  }

  var payload = {
    clientName: clientName,
    clientDni: clientDni,
    items: instoreState.items.map(item => {
      if (item.type === 'catalog') {
        return {
          type: 'catalog',
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }
      } else if (item.type === 'inventory') {
        return {
          type: 'inventory',
          inventoryItemId: item.inventoryItemId,
          price: item.price
        }
      } else {
        return {
          type: 'custom',
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }
      }
    }),
    paymentMethod: instoreState.paymentMethod,
    adminId: currentUser.id
  }

  if (instoreState.paymentMethod === 'cash') {
    payload.cashReceived = parseInt(document.getElementById('instore-cashReceived').value)
  }

  // Show loading state
  var confirmBtn = event.target
  var originalText = confirmBtn.textContent
  confirmBtn.textContent = 'Procesando...'
  confirmBtn.disabled = true

  fetch(API_URL + '/api/admin/instore-sale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(data => {
    confirmBtn.textContent = originalText
    confirmBtn.disabled = false

    if (!data.success) {
      showToast('Error: ' + (data.error || 'Error desconocido'), 'error')
      return
    }

    if (instoreState.paymentMethod === 'cash') {
      showSaleSuccess(data.order, data.change)
    } else {
      showQRModal(data)
    }
  })
  .catch(err => {
    confirmBtn.textContent = originalText
    confirmBtn.disabled = false
    console.error('Error creating sale:', err)
    showToast('Error al crear la venta', 'error')
  })
}

function showSaleSuccess(order, change) {
  var modal = document.createElement('div')
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s'

  modal.innerHTML = `
    <div style="background:var(--cream2);border-radius:16px;max-width:450px;width:100%;padding:2.5rem;text-align:center;animation:scaleIn .3s">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;animation:bounceIn .5s">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 style="margin-bottom:0.5rem;font-size:24px;font-weight:700">¡Venta Exitosa!</h2>
      <p style="margin-bottom:1.5rem;color:var(--gray);font-size:14px">Orden: <strong style="color:var(--dk)">${order.code}</strong></p>
      
      ${change > 0 ? `
        <div style="background:rgba(45,90,39,.1);padding:1rem;border-radius:10px;margin-bottom:1.5rem">
          <div style="font-size:12px;color:var(--green);font-weight:600;margin-bottom:4px">Cambio a entregar</div>
          <div style="font-size:28px;font-weight:800;color:var(--green)">$${change.toLocaleString('es-AR')}</div>
        </div>
      ` : ''}
      
      <button onclick="closeSaleSuccess(this)" class="btn btn-primary" style="width:100%;padding:14px;font-size:14px;font-weight:700">
        Nueva Venta
      </button>
    </div>
  `

  document.body.appendChild(modal)
}

function closeSaleSuccess(btn) {
  btn.closest('div[style*="fixed"]').remove()
  instoreState = {
    items: [],
    paymentMethod: null,
    cashReceived: 0,
    searchQuery: '',
    searchResults: [],
    customModal: null,
    invDevice: null
  }
  scannedInvDevice = null
  renderInStoreSale()
}

function showQRModal(data) {
  var modal = document.createElement('div')
  modal.id = 'qr-modal'
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s'

  modal.innerHTML = `
    <div style="background:var(--cream2);border-radius:16px;max-width:450px;width:100%;padding:2rem;text-align:center;animation:scaleIn .3s">
      <h2 style="margin-bottom:1.5rem;font-size:20px;font-weight:700">Escaneá el QR</h2>
      
      <div style="background:white;padding:1.5rem;border-radius:12px;margin-bottom:1.5rem;display:inline-block;box-shadow:0 4px 12px rgba(0,0,0,.1)">
        <img src="data:image/png;base64,${data.qrCodeBase64}" alt="QR Code" style="width:250px;height:250px;max-width:100%">
      </div>
      
      <div style="font-size:24px;font-weight:800;color:var(--orange);margin-bottom:0.5rem">$${data.amount.toLocaleString('es-AR')}</div>
      <div style="font-size:12px;color:var(--gray);margin-bottom:1.5rem">${data.orderCode}</div>
      
      <div id="qr-status" style="margin-bottom:1.5rem">
        <div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(255,107,44,.1);border-radius:20px">
          <div style="width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--orange);border-radius:50%;animation:spin 1s linear infinite"></div>
          <span style="font-size:13px;font-weight:600;color:var(--orange)">Esperando pago...</span>
        </div>
      </div>
      
      <button onclick="cancelInStoreSale('${data.orderId}')" class="btn btn-o" style="width:100%;padding:12px">
        Cancelar Venta
      </button>
    </div>
  `

  document.body.appendChild(modal)
  startPaymentPolling(data.orderId, data.mpPaymentId)
}

var paymentPollingInterval = null

function startPaymentPolling(orderId, mpPaymentId) {
  paymentPollingInterval = setInterval(() => {
    fetch(API_URL + '/api/admin/instore-sale/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, mpPaymentId })
    })
    .then(r => r.json())
    .then(data => {
      if (data.paid) {
        clearInterval(paymentPollingInterval)
        showPaymentSuccess(data.order)
      }
    })
    .catch(err => console.error('Error polling payment:', err))
  }, 3000)

  setTimeout(() => {
    if (paymentPollingInterval) {
      clearInterval(paymentPollingInterval)
      showToast('Tiempo de espera agotado', 'warning')
      var modal = document.getElementById('qr-modal')
      if (modal) modal.remove()
    }
  }, 600000)
}

function showPaymentSuccess(order) {
  var modal = document.getElementById('qr-modal')
  if (!modal) return

  modal.innerHTML = `
    <div style="background:var(--cream2);border-radius:16px;max-width:450px;width:100%;padding:2.5rem;text-align:center;animation:scaleIn .3s">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;animation:bounceIn .5s">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 style="margin-bottom:0.5rem;font-size:24px;font-weight:700">¡Pago Confirmado!</h2>
      <p style="margin-bottom:1.5rem;color:var(--gray);font-size:14px">Orden: <strong style="color:var(--dk)">${order.code}</strong></p>
      <button onclick="closePaymentSuccess(this)" class="btn btn-primary" style="width:100%;padding:14px;font-size:14px;font-weight:700">
        Nueva Venta
      </button>
    </div>
  `
}

function closePaymentSuccess(btn) {
  btn.closest('div[style*="fixed"]').remove()
  instoreState = {
    items: [],
    paymentMethod: null,
    cashReceived: 0,
    searchQuery: '',
    searchResults: [],
    customModal: null,
    invDevice: null
  }
  scannedInvDevice = null
  renderInStoreSale()
}

function cancelInStoreSale(orderId) {
  if (!confirm('¿Cancelar esta venta?')) return

  clearInterval(paymentPollingInterval)

  fetch(API_URL + '/api/orders?id=' + orderId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CANCELLED' })
  })
  .then(r => r.json())
  .then(() => {
    var modal = document.getElementById('qr-modal')
    if (modal) modal.remove()
    showToast('Venta cancelada', 'info')
    instoreState = {
      items: [],
      paymentMethod: null,
      cashReceived: 0,
      searchQuery: '',
      searchResults: [],
      customModal: null,
      invDevice: null
    }
    scannedInvDevice = null
    renderInStoreSale()
  })
  .catch(err => {
    console.error('Error cancelling sale:', err)
    showToast('Error al cancelar', 'error')
  })
}

function loadInStoreHistory(page, filters) {
  var content = document.getElementById('adminContent')
  if (!content) return

  page = page || 1
  filters = filters || {}

  var url = API_URL + '/api/admin/instore-sale?page=' + page + '&limit=20'

  if (filters.startDate) url += '&startDate=' + filters.startDate
  if (filters.endDate) url += '&endDate=' + filters.endDate
  if (filters.paymentMethod) url += '&paymentMethod=' + filters.paymentMethod

  content.innerHTML = `
    <div style="max-width:1200px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:8px">
        <h2 style="font-size:24px;font-weight:700">Historial de Ventas</h2>
        <button onclick="renderInStoreSale()" class="btn btn-primary">+ Nueva Venta</button>
      </div>

      <div style="background:var(--cream2);padding:1rem;border-radius:12px;margin-bottom:1.5rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end">
        <div>
          <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">Desde</label>
          <input type="date" id="filter-startDate" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">Hasta</label>
          <input type="date" id="filter-endDate" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">Método</label>
          <select id="filter-paymentMethod" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px">
            <option value="">Todos</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>
        <button onclick="applyInStoreFilters()" class="btn btn-o" style="padding:8px 16px">Filtrar</button>
      </div>

      <div id="instore-historyList" style="background:var(--cream2);border-radius:12px;padding:1rem;min-height:200px">
        <div style="text-align:center;padding:2rem;color:var(--gray)">Cargando...</div>
      </div>

      <div id="instore-historyPagination" style="margin-top:1rem"></div>
    </div>
  `

  fetch(url)
    .then(r => r.json())
    .then(res => {
      renderInStoreHistoryList(res.data)
      renderInStoreHistoryPagination(res.page, res.totalPages)
    })
    .catch(err => {
      console.error('Error loading history:', err)
      document.getElementById('instore-historyList').innerHTML = '<div style="text-align:center;padding:2rem;color:var(--red)">Error al cargar</div>'
    })
}

function renderInStoreHistoryList(orders) {
  var list = document.getElementById('instore-historyList')
  if (!list) return

  if (!orders || orders.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray)"><div style="font-size:48px;margin-bottom:1rem">📋</div><p>No hay ventas registradas</p></div>'
    return
  }

  list.innerHTML = orders.map(order => `
    <div style="background:white;padding:1rem;border-radius:10px;margin-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border);transition:all .2s;flex-wrap:wrap;gap:8px"
      onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'"
      onmouseout="this.style.boxShadow='none'">
      <div style="flex:1;min-width:200px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${order.code}</div>
        <div style="font-size:12px;color:var(--gray);margin-bottom:2px">${order.clientName} · DNI: ${order.clientDni}</div>
        <div style="font-size:11px;color:var(--gray)">${new Date(order.createdAt).toLocaleString('es-AR')}</div>
      </div>
      <div style="text-align:right;margin-right:1.5rem">
        <div style="font-size:18px;font-weight:800;color:var(--orange)">$${order.total.toLocaleString('es-AR')}</div>
        <div style="font-size:11px;color:var(--gray);margin-top:2px">${order.payment}</div>
      </div>
      <div style="min-width:100px;text-align:right">
        ${order.status === 'DELIVERED' 
          ? '<div style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:rgba(45,90,39,.1);color:var(--green);border-radius:20px;font-size:11px;font-weight:600"><span class="material-symbols-outlined" style="font-size:14px">check_circle</span> Entregado</div>'
          : order.status === 'PENDING'
          ? '<div style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:rgba(255,107,44,.1);color:var(--orange);border-radius:20px;font-size:11px;font-weight:600"><span class="material-symbols-outlined" style="font-size:14px">pending</span> Pendiente</div>'
          : '<div style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:rgba(239,68,68,.1);color:var(--red);border-radius:20px;font-size:11px;font-weight:600"><span class="material-symbols-outlined" style="font-size:14px">cancel</span> Cancelado</div>'
        }
      </div>
    </div>
  `).join('')
}

function renderInStoreHistoryPagination(currentPage, totalPages) {
  var pagination = document.getElementById('instore-historyPagination')
  if (!pagination || totalPages <= 1) return

  var html = '<div style="display:flex;justify-content:center;gap:0.5rem;flex-wrap:wrap">'

  for (var i = 1; i <= totalPages; i++) {
    html += `<button onclick="loadInStoreHistory(${i})" class="btn ${i === currentPage ? 'btn-primary' : 'btn-o'}" style="min-width:40px;padding:8px 12px">${i}</button>`
  }

  html += '</div>'
  pagination.innerHTML = html
}

function applyInStoreFilters() {
  var startDate = document.getElementById('filter-startDate').value
  var endDate = document.getElementById('filter-endDate').value
  var paymentMethod = document.getElementById('filter-paymentMethod').value

  loadInStoreHistory(1, { startDate, endDate, paymentMethod })
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl+K to focus search
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault()
    var searchInput = document.getElementById('instore-search')
    if (searchInput) searchInput.focus()
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    var modal = document.getElementById('customProductModal')
    if (modal) modal.remove()
  }
})
