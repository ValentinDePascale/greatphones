// =========== IN-STORE SALES (REDESIGNED POS) ===========
var instoreState = {
  items: [],
  paymentMethod: null,
  paymentType: null,    // 'single' | 'installments' | null
  installments: 1,
  currency: 'ARS',
  cashReceived: 0,
  searchQuery: '',
  searchResults: [],
  customModal: null,
  invDevice: null
}

var lastInstoreSaleData = null
var instoreHistoryOrders = null

// =========== CALCULADORA DE CUOTAS ===========
function openCuotasCalculator() {
  var existing = document.getElementById('cuotasCalcModal')
  if (existing) existing.remove()
  var modal = document.createElement('div')
  modal.id = 'cuotasCalcModal'
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(26,18,8,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px'
  var rateVal = window.dolarRate || ''
  modal.innerHTML =
    '<div style="background:#fff;border-radius:18px;max-width:460px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid var(--border)">' +
        '<h2 style="font-size:20px;font-weight:700;color:var(--dk)">Calculadora de Cuotas</h2>' +
        '<button onclick="closeCuotasCalculator()" style="background:transparent;border:none;font-size:24px;cursor:pointer;color:var(--gray);line-height:1">✕</button>' +
      '</div>' +
      '<div style="padding:24px;display:flex;flex-direction:column;gap:18px">' +
        '<div><label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px">Monto total</label>' +
          '<input type="number" id="calcAmount" placeholder="0" oninput="calcCuotasRender()" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:18px;font-weight:700;outline:none"></div>' +
        '<div><label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px">Cantidad de cuotas</label>' +
          '<div style="display:flex;gap:8px;align-items:center">' +
            '<input type="number" id="calcCuotas" min="1" max="36" value="3" oninput="calcCuotasRender()" style="flex:1;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:16px;outline:none">' +
            '<span style="font-size:13px;font-weight:600;color:var(--gray)">cuotas</span>' +
          '</div></div>' +
        '<div><label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px">Cotización USD (opcional)</label>' +
          '<input type="number" id="calcUsdRate" value="' + rateVal + '" placeholder="Ej: 1200" oninput="calcCuotasRender()" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;outline:none"></div>' +
        '<div id="calcResult"></div>' +
        '<div style="display:flex;gap:8px;margin-top:4px">' +
          '<button onclick="closeCuotasCalculator()" class="btn btn-o" style="flex:1;padding:12px">Cerrar</button>' +
          '<button onclick="calcCuotasUseInSale()" class="btn btn-primary" style="flex:1;padding:12px;font-weight:700">Usar en venta</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  modal.onclick = function (e) { if (e.target === modal) closeCuotasCalculator() }
  document.body.appendChild(modal)
  setTimeout(function () { var inp = document.getElementById('calcAmount'); if (inp) inp.focus() }, 50)
}

function closeCuotasCalculator() {
  var m = document.getElementById('cuotasCalcModal')
  if (m) m.remove()
}

function calcCuotasRender() {
  var box = document.getElementById('calcResult')
  if (!box) return
  var amount = parseFloat(document.getElementById('calcAmount').value) || 0
  var cuotas = parseInt(document.getElementById('calcCuotas').value) || 1
  var rate = parseFloat(document.getElementById('calcUsdRate').value) || 0
  if (cuotas < 1) cuotas = 1
  if (amount <= 0) {
    box.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--gray);font-size:13px">Ingresá un monto para ver el detalle de las cuotas.</div>'
    return
  }
  var porCuota = Math.round(amount / cuotas)
  var usdTotal = rate > 0 ? Math.round(amount / rate) : 0
  var usdPorCuota = rate > 0 ? Math.round(porCuota / rate) : 0
  var rows = ''
  for (var i = 1; i <= cuotas; i++) {
    rows += '<div style="display:flex;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--border);font-size:13px">' +
      '<span style="color:var(--gray)">Cuota ' + i + '</span>' +
      '<span style="font-weight:700;color:var(--dk)">$' + porCuota.toLocaleString('es-AR') +
      (rate > 0 ? (' <span style="color:var(--orange);font-weight:600">/ US$ ' + usdPorCuota.toLocaleString('es-AR') + '</span>') : '') + '</span>' +
    '</div>'
  }
  box.innerHTML =
    '<div style="background:var(--cream2);border-radius:12px;overflow:hidden;border:1px solid var(--border)">' +
      '<div style="display:flex;justify-content:space-between;padding:14px 12px;background:rgba(255,107,44,.08);border-bottom:1px solid var(--border);flex-wrap:wrap;gap:4px">' +
        '<div><div style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Por cuota</div>' +
          '<div style="font-size:18px;font-weight:800;color:var(--orange)">$' + porCuota.toLocaleString('es-AR') + '</div></div>' +
        '<div style="text-align:right"><div style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:var(--gray)">Total</div>' +
          '<div style="font-size:18px;font-weight:800;color:var(--dk)">$' + amount.toLocaleString('es-AR') +
          (rate > 0 ? (' <span style="color:var(--orange);font-size:13px">/ US$ ' + usdTotal.toLocaleString('es-AR') + '</span>') : '') + '</div></div>' +
      '</div>' +
      rows +
    '</div>'
}

function calcCuotasUseInSale() {
  var amount = parseFloat(document.getElementById('calcAmount').value) || 0
  var cuotas = parseInt(document.getElementById('calcCuotas').value) || 1
  if (amount <= 0) { showToast('Ingresá un monto válido', 'error'); return }
  // Pre-carga el estado de venta en tienda
  instoreState.installments = cuotas
  instoreState.paymentType = cuotas > 1 ? 'installments' : 'single'
  // Si ya hay items, ajusta el total; si no, deja registrado para usar al agregar
  window._calcPendingAmount = amount
  // Navega a la venta si no estamos ahí
  if (typeof renderInStoreSale === 'function') {
    var btn = document.getElementById('adm-instore')
    if (btn && !btn.classList.contains('act')) adminTab('instore', btn)
  }
  selectPaymentType(cuotas > 1 ? 'installments' : 'single')
  if (cuotas > 1 && typeof selectInstallments === 'function') selectInstallments(cuotas)
  closeCuotasCalculator()
  showToast('Cuotas cargadas: ' + cuotas + ' de $' + Math.round(amount / cuotas).toLocaleString('es-AR'), 'success')
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
          <div style="display:flex;gap:8px">
            <button onclick="openCuotasCalculator()" class="btn btn-o" style="padding:8px 16px">
              <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">calculate</span>
              Calculadora de cuotas
            </button>
            <button onclick="loadInStoreHistory()" class="btn btn-o" style="padding:8px 16px">
              <span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">history</span>
              Historial
            </button>
          </div>
        </div>

        <!-- Client Info -->
        <div style="background:var(--cream2);padding:1rem;border-radius:12px;border:1px solid var(--border)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px">Apellido y Nombre</label>
              <input type="text" id="instore-clientName" placeholder="Nombre completo" 
                style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px">DNI</label>
              <input type="text" id="instore-clientDni" placeholder="12345678" 
                style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px">CUIL / CUIT</label>
              <input type="text" id="instore-clientCuil" placeholder="20-12345678-9" maxlength="14"
                style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px">Tel</label>
              <input type="text" id="instore-clientPhone" placeholder="2914727351"
                style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px">Domicilio</label>
              <input type="text" id="instore-clientAddress" placeholder="Calle 123"
                style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;margin-top:4px;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px">Email</label>
              <input type="email" id="instore-clientEmail" placeholder="cliente@email.com"
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
          
          <!-- Payment Section -->
          <div style="margin-bottom:1.5rem">

            <!-- Step 1: Tipo de pago -->
            <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">1. Tipo de pago</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.75rem">
              <button onclick="selectPaymentType('single')" id="btn-type-single"
                style="padding:10px;border:2px solid var(--border);border-radius:10px;background:white;cursor:pointer;transition:all .2s">
                <div style="font-size:16px;margin-bottom:2px">💵</div>
                <div style="font-size:11px;font-weight:600">Un pago</div>
              </button>
              <button onclick="selectPaymentType('installments')" id="btn-type-installments"
                style="padding:10px;border:2px solid var(--border);border-radius:10px;background:white;cursor:pointer;transition:all .2s">
                <div style="font-size:16px;margin-bottom:2px">📆</div>
                <div style="font-size:11px;font-weight:600">Cuotas</div>
              </button>
            </div>

            <div id="instore-installmentsSection" style="display:none;margin-bottom:0.75rem">
              <label style="font-size:11px;font-weight:600;color:var(--gray);display:block;margin-bottom:4px">Cantidad de cuotas</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="number" id="instore-installments" min="2" max="36" value="3"
                  oninput="selectInstallments(this.value)"
                  style="flex:1;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none">
                <span style="font-size:12px;font-weight:600;color:var(--gray);white-space:nowrap">cuotas</span>
              </div>
              <div id="instore-installmentsInfo" style="display:none;margin-top:8px;padding:8px 10px;background:rgba(255,107,44,.08);border-radius:8px">
                <div style="font-size:12px;color:var(--orange);font-weight:600" id="instore-installmentsDetail"></div>
              </div>
            </div>

            <!-- Step 2: Método de pago -->
            <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">2. Método de pago</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.75rem">
              <button onclick="instoreSelectPaymentMethod('cash')" id="btn-cash"
                style="padding:10px;border:2px solid var(--border);border-radius:10px;background:white;cursor:pointer;transition:all .2s">
                <div style="font-size:16px;margin-bottom:2px">💵</div>
                <div style="font-size:11px;font-weight:600">Efectivo</div>
              </button>
              <button onclick="instoreSelectPaymentMethod('transfer')" id="btn-transfer"
                style="padding:10px;border:2px solid var(--border);border-radius:10px;background:white;cursor:pointer;transition:all .2s">
                <div style="font-size:16px;margin-bottom:2px">📲</div>
                <div style="font-size:11px;font-weight:600">Transferencia</div>
              </button>
            </div>

            <!-- Transfer Section -->
            <div id="instore-transferSection" style="display:none;border-top:1px solid var(--border);padding-top:0.75rem;margin-bottom:0.75rem">
              <div style="padding:10px 12px;background:rgba(45,90,39,.08);border-radius:8px;margin-bottom:8px">
                <div style="font-size:11px;color:var(--gray);margin-bottom:4px">Alias</div>
                <div style="font-size:14px;font-weight:700;letter-spacing:1px;color:var(--dk)">GREATPHONES.MP</div>
              </div>
              <div style="padding:10px 12px;background:rgba(45,90,39,.08);border-radius:8px;margin-bottom:8px">
                <div style="font-size:11px;color:var(--gray);margin-bottom:4px">CBU</div>
                <div style="font-size:13px;font-weight:600;letter-spacing:1px;color:var(--dk)">0000003100085741097853</div>
              </div>
              <button onclick="generateTransferQr()" id="btn-genQr" style="width:100%;padding:10px;background:var(--orange);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">
                Generar QR de pago
              </button>
              <div id="instore-transferQrContainer" style="display:none;margin-top:10px;text-align:center"></div>
            </div>

            <!-- Cash Section -->
            <div id="instore-cashSection" style="display:none;border-top:1px solid var(--border);padding-top:0.75rem;margin-bottom:0.75rem">
              <div style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">
                Monto Recibido <span id="instore-expectedLabel" style="font-weight:400;text-transform:none;color:var(--orange)"></span>
              </div>
              <input type="number" id="instore-cashReceived" placeholder="0"
                oninput="calculateChange()"
                style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:0.5rem;box-sizing:border-box">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(45,90,39,.1);border-radius:8px">
                <span style="font-size:12px;font-weight:600;color:var(--green)">Cambio</span>
                <span id="instore-change" style="font-size:16px;font-weight:700;color:var(--green)">$0</span>
              </div>
            </div>

            <!-- USD Exchange Rate Section -->
            <div id="instore-usdSection" style="display:none;border-top:1px solid var(--border);padding-top:0.75rem;margin-bottom:0.75rem">
              <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">Cotización del Dólar</label>
              <input type="number" id="instore-usdRate" placeholder="Ej: 1200"
                oninput="updateUsdTotal()"
                style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:0.5rem;box-sizing:border-box">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,107,44,.08);border-radius:8px">
                <span style="font-size:12px;font-weight:600;color:var(--orange)">Total en USD</span>
                <span id="instore-usdTotal" style="font-size:16px;font-weight:700;color:var(--orange)">US$ 0</span>
              </div>
            </div>

            <!-- Step 3: Moneda -->
            <label style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:0.5rem">3. Moneda</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.75rem">
              <button onclick="selectCurrency('ARS')" id="btn-curr-ARS"
                style="padding:10px;border:2px solid var(--green);border-radius:10px;background:rgba(45,90,39,.1);cursor:pointer;transition:all .2s">
                <div style="font-size:11px;font-weight:600">$ ARS</div>
              </button>
              <button onclick="selectCurrency('USD')" id="btn-curr-USD"
                style="padding:10px;border:2px solid var(--border);border-radius:10px;background:white;cursor:pointer;transition:all .2s">
                <div style="font-size:11px;font-weight:600">US$ USD</div>
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

  container.innerHTML = results.map(function(item, idx) {
    var isInCart = instoreState.items.find(function(i) { return i.productId === item.id || i.id === item.id })
    var stockLow = item.stock <= 2
    
    return `
      <div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:white;border-radius:10px;margin-bottom:0.5rem;border:1px solid ${isInCart ? 'var(--orange)' : 'var(--border)'};cursor:pointer;transition:all .2s"
        onclick="addFromSearchResult(${idx})"
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

function addFromSearchResult(idx) {
  var item = instoreState.searchResults[idx]
  if (!item) return
  addFromSearch(item.id, item.name, item.price, item.stock, item.itemType, item.imageUrl, item.brand, item.color, item.battery, item.storage, item.imei)
}

function addFromSearch(id, name, price, stock, itemType, imageUrl, brand, color, battery, storage, imei) {
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
      itemType: itemType,
      brand: brand || '',
      color: color || '',
      battery: battery || '',
      storage: storage || '',
      imei: imei || ''
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

function selectPaymentType(type) {
  instoreState.paymentType = type
  var singleBtn = document.getElementById('btn-type-single')
  var instBtn = document.getElementById('btn-type-installments')

  if (type === 'single') {
    singleBtn.style.borderColor = 'var(--green)'
    singleBtn.style.background = 'rgba(45,90,39,.1)'
    instBtn.style.borderColor = 'var(--border)'
    instBtn.style.background = 'white'
    document.getElementById('instore-installmentsSection').style.display = 'none'
    instoreState.installments = 1
  } else {
    instBtn.style.borderColor = 'var(--green)'
    instBtn.style.background = 'rgba(45,90,39,.1)'
    singleBtn.style.borderColor = 'var(--border)'
    singleBtn.style.background = 'white'
    document.getElementById('instore-installmentsSection').style.display = 'block'
    var input = document.getElementById('instore-installments')
    selectInstallments(input.value)
  }
}

function selectInstallments(n) {
  var num = parseInt(n) || 1
  if (num < 1) num = 1
  if (num > 36) num = 36
  instoreState.installments = num
  if (num <= 1) {
    document.getElementById('instore-installmentsInfo').style.display = 'none'
    return
  }
  var total = instoreState.items.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)) }, 0)
  var porCuota = Math.round(total / num)
  document.getElementById('instore-installmentsDetail').textContent =
    num + ' cuota' + (num > 1 ? 's' : '') + ' de ' + formatMoney(porCuota) + ' c/u — Total: ' + formatMoney(total)
  document.getElementById('instore-installmentsInfo').style.display = 'block'
}

function selectCurrency(curr) {
  instoreState.currency = curr
  var arsBtn = document.getElementById('btn-curr-ARS')
  var usdBtn = document.getElementById('btn-curr-USD')
  if (curr === 'ARS') {
    arsBtn.style.borderColor = 'var(--green)'
    arsBtn.style.background = 'rgba(45,90,39,.1)'
    usdBtn.style.borderColor = 'var(--border)'
    usdBtn.style.background = 'white'
    document.getElementById('instore-usdSection').style.display = 'none'
  } else {
    usdBtn.style.borderColor = 'var(--green)'
    usdBtn.style.background = 'rgba(45,90,39,.1)'
    arsBtn.style.borderColor = 'var(--border)'
    arsBtn.style.background = 'white'
    document.getElementById('instore-usdSection').style.display = 'block'
    updateUsdTotal()
  }
  updateSummary()
}

function generateTransferQr() {
  var btn = document.getElementById('btn-genQr')
  btn.textContent = 'Generando...'
  btn.disabled = true
  var total = instoreState.items.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)) }, 0)
  fetch(API_URL + '/api/admin/instore-sale/generate-qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
    body: JSON.stringify({
      amount: total,
      currency: instoreState.currency,
      installments: instoreState.installments
    })
  })
  .then(function(r) { return r.json() })
  .then(function(data) {
    btn.textContent = 'Generar QR de pago'
    btn.disabled = false
    if (data.qrCodeBase64) {
      var container = document.getElementById('instore-transferQrContainer')
      container.innerHTML = '<div style="background:white;padding:1rem;border-radius:10px;display:inline-block;box-shadow:0 4px 12px rgba(0,0,0,.1)">' +
        '<img src="data:image/png;base64,' + data.qrCodeBase64 + '" alt="QR" style="width:200px;height:200px;max-width:100%"></div>' +
        '<div style="font-size:14px;font-weight:700;color:var(--orange);margin-top:8px">' + formatMoney(data.amount) + '</div>'
      container.style.display = 'block'
    } else {
      showToast('Error al generar QR', 'error')
    }
  })
  .catch(function() {
    btn.textContent = 'Generar QR de pago'
    btn.disabled = false
    showToast('Error al generar QR', 'error')
  })
}

function getExpectedAmount() {
  var total = instoreState.items.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)) }, 0)
  if (instoreState.installments > 1) {
    return Math.round(total / instoreState.installments)
  }
  return total
}

function updateUsdTotal() {
  var rate = parseFloat(document.getElementById('instore-usdRate').value) || 0
  var total = instoreState.items.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)) }, 0)
  var usdTotal = rate > 0 ? Math.round(total / rate) : 0
  document.getElementById('instore-usdTotal').textContent = 'US$ ' + usdTotal.toLocaleString('es-AR')
}

function formatMoney(n) {
  var curr = instoreState.currency === 'USD' ? 'US$' : '$'
  return curr + ' ' + n.toLocaleString('es-AR')
}

function instoreSelectPaymentMethod(method) {
  instoreState.paymentMethod = method

  var cashBtn = document.getElementById('btn-cash')
  var transferBtn = document.getElementById('btn-transfer')

  if (method === 'cash') {
    cashBtn.style.borderColor = 'var(--green)'
    cashBtn.style.background = 'rgba(45,90,39,.1)'
    transferBtn.style.borderColor = 'var(--border)'
    transferBtn.style.background = 'white'
    document.getElementById('instore-transferSection').style.display = 'none'
    document.getElementById('instore-cashSection').style.display = 'block'
    calculateChange()
  } else {
    transferBtn.style.borderColor = 'var(--green)'
    transferBtn.style.background = 'rgba(45,90,39,.1)'
    cashBtn.style.borderColor = 'var(--border)'
    cashBtn.style.background = 'white'
    document.getElementById('instore-cashSection').style.display = 'none'
    document.getElementById('instore-transferSection').style.display = 'block'
  }
}

function calculateChange() {
  var cashReceived = parseInt(document.getElementById('instore-cashReceived').value) || 0
  var expected = getExpectedAmount()
  var change = cashReceived - expected

  var labelEl = document.getElementById('instore-expectedLabel')
  if (instoreState.installments > 1) {
    labelEl.textContent = '(1° cuota: ' + formatMoney(expected) + ')'
  } else {
    labelEl.textContent = ''
  }

  var changeEl = document.getElementById('instore-change')
  changeEl.textContent = '$' + change.toLocaleString('es-AR')
  changeEl.style.color = change >= 0 ? 'var(--green)' : 'var(--red)'
}

function updateSummary() {
  var subtotal = instoreState.items.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)) }, 0)

  if (instoreState.currency === 'USD') {
    var rate = parseFloat(document.getElementById('instore-usdRate')?.value) || 0
    var usdTotal = rate > 0 ? Math.round(subtotal / rate) : 0
    document.getElementById('instore-subtotal').textContent = 'AR$ ' + subtotal.toLocaleString('es-AR')
    document.getElementById('instore-total').textContent = 'US$ ' + usdTotal.toLocaleString('es-AR')
  } else {
    document.getElementById('instore-subtotal').textContent = formatMoney(subtotal)
    document.getElementById('instore-total').textContent = formatMoney(subtotal)
  }

  if (instoreState.installments > 1) {
    var porCuota = Math.round(subtotal / instoreState.installments)
    document.getElementById('instore-installmentsDetail').textContent =
      instoreState.installments + ' cuotas de ' + (instoreState.currency === 'USD' ? 'US$ ' : '$ ') + porCuota.toLocaleString('es-AR') + ' c/u — Total: ' + (instoreState.currency === 'USD' ? 'US$ ' : '$ ') + subtotal.toLocaleString('es-AR')
  }

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
      paymentType: null,
      installments: 1,
      currency: 'ARS',
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

  if (!instoreState.paymentType) {
    showToast('Seleccioná el tipo de pago (un pago o cuotas)', 'error')
    return
  }

  if (!instoreState.paymentMethod) {
    showToast('Seleccioná un método de pago', 'error')
    return
  }

  var total = instoreState.items.reduce(function(s, i) { return s + (i.price * (i.quantity || 1)) }, 0)

  if (instoreState.paymentMethod === 'cash') {
    var cashReceived = parseInt(document.getElementById('instore-cashReceived').value) || 0
    var expected = getExpectedAmount()
    if (cashReceived < expected) {
      showToast('Monto recibido insuficiente', 'error')
      return
    }
  }

  var payload = {
    clientName: clientName,
    clientDni: clientDni,
    clientCuil: (document.getElementById('instore-clientCuil')||{}).value || '',
    clientPhone: (document.getElementById('instore-clientPhone')||{}).value || '',
    clientAddress: (document.getElementById('instore-clientAddress')||{}).value || '',
    clientEmail: (document.getElementById('instore-clientEmail')||{}).value || '',
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
    currency: instoreState.currency,
    installments: instoreState.installments,
    usdRate: instoreState.currency === 'USD' ? (parseFloat(document.getElementById('instore-usdRate').value) || 0) : 0,
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
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
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

    // Save sale data for receipt generation
    lastInstoreSaleData = {
      order: data.order || null,
      change: data.change || 0,
      items: instoreState.items.slice(),
      paymentMethod: instoreState.paymentMethod,
      cashReceived: instoreState.paymentMethod === 'cash' ? parseInt((document.getElementById('instore-cashReceived')||{}).value || 0) : 0,
      currency: data.currency || instoreState.currency,
      installments: data.installments || instoreState.installments
    }

    // Refresh products list so stock reflects the sale
    if (typeof loadProducts === 'function') { window._productsLoaded = false; loadProducts() }

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

// =========== RECIBO PDF ===========
var jsPdfLoaded = false

function loadJsPdf(cb){
  if(window.jsPDF){jsPdfLoaded=true;cb();return}
  if(jsPdfLoaded){cb();return}
  var s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
  s.onload=function(){jsPdfLoaded=true;cb()};
  document.head.appendChild(s);
}

function numeroALetras(n){
  var UNIDADES=['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte'];
  var DECENAS=['','diez','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  var CENTENAS=['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'];
  var n=Math.round(n);
  if(n===0)return 'cero pesos';
  if(n===100)return 'cien pesos';
  var r='';
  if(n>=1000){
    var miles=Math.floor(n/1000);
    var resto=n%1000;
    if(miles===1)r+='mil';else r+=numeroALetras(miles)+' mil';
    if(resto>0)r+=' '+numeroALetras(resto);
    return r+' pesos';
  }
  if(n>=100){
    var c=Math.floor(n/100);
    r+=CENTENAS[c];
    var resto=n%100;
    if(resto>0)r+=' '+numeroALetras(resto);
    return r+' pesos';
  }
  if(n>=20){
    var d=Math.floor(n/10);
    var u=n%10;
    r=DECENAS[d];
    if(u>0)r+=' y '+UNIDADES[u];
    return r+' pesos';
  }
  return UNIDADES[n]+' pesos';
}

function generarReciboPDF(){
  return new Promise(function(resolve){
    loadJsPdf(function(){
      var d=lastInstoreSaleData;
      if(!d||!d.order){resolve(null);return}
      var order=d.order;
      var items=d.items||[];
      var jsPDF=window.jspdf.jsPDF;
      var doc=new jsPDF({unit:'mm',format:'a4'});
      var W=210,H=297;
      var ML=18,MR=18;
      var CW=W-ML-MR;
      var ORANGE=[255,107,44];
      var GREEN=[76,175,80];
      var DK=[35,31,32];
      var GRAY=[120,120,120];
      var LGRAY=[200,200,200];
      var y=0;

      function pdfBrand(brand){
        var map={iphone:'Apple'};
        return map[(brand||'').toLowerCase()]||brand||'';
      }

      function ln(s){y+=s||4}
      function hline(){
        doc.setDrawColor(ORANGE[0],ORANGE[1],ORANGE[2]);
        doc.setLineWidth(0.8);
        doc.line(ML,y,W-MR,y);
        y+=3;
      }
      function sectionTitle(t){
        doc.setFont('helvetica','bold');
        doc.setFontSize(9);
        doc.setTextColor(DK[0],DK[1],DK[2]);
        doc.text(t,ML,y);
        ln(5);
      }
      function fieldFilled(label,value,lw){
        doc.setFont('helvetica','bold');
        doc.setFontSize(7.5);
        doc.setTextColor(DK[0],DK[1],DK[2]);
        doc.text(label,ML,y);
        doc.setFont('helvetica','normal');
        doc.text(value||'',ML+lw,y);
        doc.setDrawColor(LGRAY[0],LGRAY[1],LGRAY[2]);
        doc.setLineWidth(0.3);
        doc.line(ML+lw,y+1,ML+lw+50,y+1);
      }
      function fieldFilled2(label,value,lw,label2,value2,lw2){
        doc.setFont('helvetica','bold');
        doc.setFontSize(7.5);
        doc.setTextColor(DK[0],DK[1],DK[2]);
        doc.text(label,ML,y);
        doc.setFont('helvetica','normal');
        doc.text(value||'',ML+lw,y);
        doc.setDrawColor(LGRAY[0],LGRAY[1],LGRAY[2]);
        doc.setLineWidth(0.3);
        doc.line(ML+lw,y+1,ML+lw+50,y+1);

        var c2=115;
        doc.text(label2,c2,y);
        doc.setFont('helvetica','normal');
        doc.text(value2||'',c2+lw2,y);
        doc.line(c2+lw2,y+1,c2+lw2+50,y+1);
      }
      function checkbox(x,yPos,label){
        doc.setDrawColor(DK[0],DK[1],DK[2]);
        doc.setLineWidth(0.3);
        doc.rect(x,yPos-3,3,3);
        doc.setFont('helvetica','normal');
        doc.setFontSize(7);
        doc.setTextColor(DK[0],DK[1],DK[2]);
        doc.text(label,x+4.5,yPos);
      }

      // ===================== HEADER =====================
      doc.setFont('helvetica','bold');
      doc.setFontSize(18);
      doc.setTextColor(DK[0],DK[1],DK[2]);
      doc.text('GreatPhones',ML,14);

      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      doc.text('RECIBO DE VENTA',W-MR,14,{align:'right'});

      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      doc.setTextColor(GRAY[0],GRAY[1],GRAY[2]);
      doc.text('Zelarrayan 179 · Bahía Blanca · 2914727351',ML,18);

      var fecha=new Date(order.createdAt||Date.now());
      var fechaStr=fecha.getDate()+'/'+(fecha.getMonth()+1)+'/'+fecha.getFullYear();

      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      doc.setTextColor(DK[0],DK[1],DK[2]);
      doc.text('Nº:',W-MR-45,18);
      doc.text(order.code||'',W-MR-40,18);
      doc.setDrawColor(LGRAY[0],LGRAY[1],LGRAY[2]);
      doc.setLineWidth(0.3);
      doc.line(W-MR-40,18.5,W-MR-10,18.5);

      doc.text('Fecha:',W-MR-10,18);
      doc.text(fechaStr,W-MR-2,18);

      y=23;
      hline();

      // ===================== DISPOSITIVO =====================
      ln(4);
      sectionTitle('DATOS DEL DISPOSITIVO');

      var invItems=items.filter(function(i){return i.type==='inventory'});
      var catItems=items.filter(function(i){return i.type==='catalog'});

      if(invItems.length>0){
        invItems.forEach(function(item){
          var brandModel=pdfBrand(item.brand)+' '+item.modelName+(item.storage?' '+item.storage:'');
          fieldFilled2('Marca/Modelo:',brandModel,30,'IMEI:',item.imei||'',12);
          ln(7);
          fieldFilled2('Color:',item.color||'',14,'Batería:',item.batteryPct?(item.batteryPct+'%'):'',14);
          ln(8);
        });
      }else if(catItems.length>0){
        catItems.forEach(function(item){
          var modelPart=item.name;
          if(item.brand&&item.name.toLowerCase().indexOf(item.brand.toLowerCase())===0)
            modelPart=item.name.substring(item.brand.length).trim();
          var brandModel=pdfBrand(item.brand)+(modelPart?' '+modelPart:'');
          if(item.storage) brandModel+=' '+item.storage;
          fieldFilled2('Marca/Modelo:',brandModel,30,'IMEI:',item.imei||'',12);
          ln(7);
          fieldFilled2('Color:',item.color||'',14,'Batería:',item.battery?(item.battery+'%'):'',14);
          ln(8);
        });
      }else{
        var firstItem=items[0]||{};
        fieldFilled2('Marca/Modelo:',firstItem.customName||firstItem.name||'',30,'IMEI:','',12);
        ln(7);
        fieldFilled2('Color:','',14,'Batería:','',14);
        ln(8);
      }

      hline();

      // ===================== ACCESORIOS =====================
      ln(4);
      sectionTitle('ACCESORIOS INCLUIDOS');

      var accesorios=['Cable USB-C / Lightning','Cabezal de cargador','Funda protectora','Vidrio templado'];
      var accX=ML;
      accesorios.forEach(function(a){
        checkbox(accX,y,a);
        accX+=doc.getTextWidth(a)+12;
      });
      ln(8);

      // ===================== PRECIO Y FORMA DE PAGO =====================
      var boxTop=y;
      var boxH=48;

      doc.setFillColor(255,249,245);
      doc.setDrawColor(ORANGE[0],ORANGE[1],ORANGE[2]);
      doc.setLineWidth(0.8);
      doc.roundedRect(ML,boxTop,CW,boxH,3,3,'FD');

      doc.setFillColor(ORANGE[0],ORANGE[1],ORANGE[2]);
      doc.rect(ML,boxTop,CW,7,'F');
      doc.setFont('helvetica','bold');
      doc.setFontSize(8);
      doc.setTextColor(255,255,255);
      doc.text('PRECIO Y FORMA DE PAGO',W/2,boxTop+4.8,{align:'center'});

      y=boxTop+12;

      var leftX=ML+2;
      var rightX=ML+CW/2+5;

      // LEFT: PRECIO TOTAL
      doc.setFont('helvetica','bold');
      doc.setFontSize(8);
      doc.setTextColor(DK[0],DK[1],DK[2]);
      doc.text('PRECIO TOTAL',leftX,y);
      ln(5);

      var currencySymbol = (order.currency||'ARS') === 'USD' ? 'US$' : '$';
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      doc.text(currencySymbol,leftX,y);
      doc.text((order.total||0).toLocaleString('es-AR'),leftX+5+((order.currency||'ARS')==='USD'?3:0),y);
      doc.setDrawColor(DK[0],DK[1],DK[2]);
      doc.setLineWidth(0.5);
      doc.line(leftX+5+((order.currency||'ARS')==='USD'?3:0),y+1,leftX+55+((order.currency||'ARS')==='USD'?3:0),y+1);
      ln(5);

      doc.setFont('helvetica','normal');
      doc.setFontSize(6.5);
      doc.text((order.currency||'ARS') === 'USD' ? 'Son dólares:' : 'Son pesos:',leftX,y);
      doc.setFont('helvetica','italic');
      doc.text(numeroALetras(order.total||0),leftX+14,y);
      doc.setDrawColor(LGRAY[0],LGRAY[1],LGRAY[2]);
      doc.setLineWidth(0.3);
      doc.line(leftX+14,y+1,leftX+CW/2-4,y+1);

      // RIGHT: DETALLE DEL PAGO
      y=boxTop+12;
      doc.setFont('helvetica','bold');
      doc.setFontSize(7);
      doc.setTextColor(DK[0],DK[1],DK[2]);
      doc.text('DETALLE DEL PAGO (completar solo los que apliquen):',rightX,y);
      ln(5);

      var currSymbol = (order.currency||'ARS') === 'USD' ? 'US$' : '$';
      var isUSD = (order.currency||'ARS') === 'USD';

      checkbox(rightX,y,'Efectivo:');
      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      doc.text(currSymbol,rightX+24,y);
      if(order.payment==='Efectivo'){
        doc.text((order.cashReceived||order.total||0).toLocaleString('es-AR'),rightX+28,y);
      }
      doc.setDrawColor(ORANGE[0],ORANGE[1],ORANGE[2]);
      doc.setLineWidth(0.3);
      doc.line(rightX+28,y+1,rightX+70,y+1);
      ln(5);

      checkbox(rightX,y,'Transferencia:');
      doc.setFont('helvetica','normal');
      doc.setFontSize(7);
      doc.text(currSymbol,rightX+32,y);
      if(order.payment==='Transferencia'){
        doc.text((order.total||0).toLocaleString('es-AR'),rightX+36,y);
      }
      doc.setDrawColor(ORANGE[0],ORANGE[1],ORANGE[2]);
      doc.setLineWidth(0.3);
      doc.line(rightX+36,y+1,rightX+70,y+1);
      ln(5);

      if ((order.cuotas||1) > 1) {
        var porCuota = Math.round((order.total||0) / (order.cuotas||1));
        checkbox(rightX,y,'Cuotas:');
        doc.setFont('helvetica','normal');
        doc.setFontSize(7);
        doc.text(order.cuotas + ' x ' + currSymbol + ' ' + porCuota.toLocaleString('es-AR') + ' = ' + currSymbol + ' ' + (order.total||0).toLocaleString('es-AR'),rightX+20,y);
        ln(5);
      }

      doc.setFont('helvetica','bold');
      doc.setFontSize(6.5);
      doc.text('N° ref. transferencia / comprobante:',rightX,y);
      doc.setFont('helvetica','normal');
      doc.setDrawColor(ORANGE[0],ORANGE[1],ORANGE[2]);
      doc.line(rightX+40,y+1,rightX+70,y+1);

      y=boxTop+boxH+5;

      // ===================== DATOS DEL COMPRADOR =====================
      sectionTitle('DATOS DEL COMPRADOR');

      var colLeft=ML;
      var colRight=115;
      var buyerStartY=y;

      // Left column
      fieldFilled('Apellido y Nombre:',order.clientName||'',35);
      ln(7);
      fieldFilled('DNI:',order.clientDni||'',10);
      ln(7);
      fieldFilled('CUIL / CUIT:',order.clientCuil||'',24);

      var buyerEndY=y;

      // Right column
      y=buyerStartY;
      doc.setFont('helvetica','bold');
      doc.setFontSize(7.5);
      doc.setTextColor(DK[0],DK[1],DK[2]);
      doc.text('Tel:',colRight,y);
      doc.setFont('helvetica','normal');
      doc.text(order.clientPhone||'',colRight+10,y);
      doc.setDrawColor(LGRAY[0],LGRAY[1],LGRAY[2]);
      doc.setLineWidth(0.3);
      doc.line(colRight+10,y+1,colRight+60,y+1);
      y=buyerStartY+7;

      doc.setFont('helvetica','bold');
      doc.text('Domicilio:',colRight,y);
      doc.setFont('helvetica','normal');
      doc.text(order.clientAddress||'',colRight+22,y);
      doc.line(colRight+22,y+1,colRight+72,y+1);
      y=buyerStartY+14;

      doc.setFont('helvetica','bold');
      doc.text('Email:',colRight,y);
      doc.setFont('helvetica','normal');
      doc.text(order.clientEmail||'',colRight+14,y);
      doc.line(colRight+14,y+1,colRight+64,y+1);

      // Vertical separator
      doc.setDrawColor(GREEN[0],GREEN[1],GREEN[2]);
      doc.setLineWidth(0.3);
      doc.line(colRight-3,buyerStartY-2,colRight-3,buyerEndY+5);

      y=buyerEndY+8;
      hline();

      // ===================== GARANTÍA =====================
      ln(3);
      sectionTitle('GARANTÍA');

      doc.setFont('helvetica','normal');
      doc.setFontSize(6);
      doc.setTextColor(60,60,60);

      doc.text('El equipo adquirido cuenta con una garantía de 12 (doce) meses desde la fecha de compra.',ML,y);ln(3);
      doc.text('La garantía cubre únicamente fallas técnicas de origen no provocadas por el cliente, incluyendo problemas de encendido, fallas internas de pantalla, batería',ML,y);ln(3);
      doc.text('defectuosa de origen, fallas de software persistentes, problemas de carga, audio, cámara o conectividad.',ML,y);ln(3);
      doc.text('Toda garantía queda sujeta a diagnóstico y verificación técnica por parte del local.',ML,y);ln(3);
      doc.text('La garantía NO cubre: Pantallas rotas, fisuradas o con daño físico. Golpes, rayones, deformaciones o daños estéticos. Daño por líquido o humedad. Equipos',ML,y);ln(3);
      doc.text('abiertos, manipulados o reparados por terceros. Daños ocasionados por accesorios no originales o uso incorrecto. Problemas relacionados con cuentas,',ML,y);ln(3);
      doc.text('contraseñas o bloqueos del usuario. Daños eléctricos externos. Fallas posteriores al vencimiento del plazo de garantía.',ML,y);ln(3);
      doc.text('Si el equipo presenta evidencia física de golpe, humedad o manipulación externa, la garantía quedará automáticamente anulada.',ML,y);ln(3.5);
      doc.text('En caso de ingreso por garantía:',ML,y);ln(3.5);

      doc.setFont('helvetica','bold');
      doc.text('1.',ML,y);
      doc.setFont('helvetica','normal');
      doc.text('El equipo será evaluado técnicamente. El local dispondrá de un plazo de 48 (cuarenta y ocho) horas hábiles desde el ingreso del equipo para emitir el',ML+5,y);ln(3);
      doc.text('diagnóstico correspondiente e informar al cliente si el caso encuadra dentro de las condiciones de garantía.',ML+5,y);
      ln(3.5);

      doc.setFont('helvetica','bold');
      doc.text('2.',ML,y);
      doc.setFont('helvetica','normal');
      doc.text('El local determinará si corresponde garantía según el diagnóstico realizado. Una vez comunicada la aceptación, el local dispondrá de 96 (noventa y seis)',ML+5,y);ln(3);
      doc.text('horas hábiles adicionales para llevar a cabo la reparación o brindar una resolución definitiva. Este plazo podrá extenderse en casos de fuerza mayor, tales',ML+5,y);ln(3);
      doc.text('como fallas de placa, demoras en disponibilidad de repuestos u otras situaciones excepcionales debidamente justificadas, de lo cual se informará al cliente',ML+5,y);ln(3);
      doc.text('oportunamente.',ML+5,y);
      ln(3.5);

      doc.setFont('helvetica','bold');
      doc.text('3.',ML,y);
      doc.setFont('helvetica','normal');
      doc.text('Si corresponde garantía, el local podrá optar por:',ML+5,y);
      ln(3);
      doc.text('    o    reparación,',ML+5,y);
      ln(3);
      doc.text('    o    reemplazo del equipo,',ML+5,y);
      ln(3);
      doc.text('    o    o devolución del dinero abonado.',ML+5,y);
      ln(3.5);

      doc.text('La devolución de dinero será siempre la última instancia luego de intentar reparación o reposición.',ML,y);ln(3);
      doc.text('El cliente declara haber recibido el equipo en correcto estado de funcionamiento y haber leído y aceptado las presentes condiciones de garantía.',ML,y);
      ln(8);

      // ===================== FIRMAS =====================
      doc.setDrawColor(ORANGE[0],ORANGE[1],ORANGE[2]);
      doc.setLineWidth(0.8);
      doc.line(ML,y,W-MR,y);
      ln(2);

      doc.setDrawColor(LGRAY[0],LGRAY[1],LGRAY[2]);
      doc.setLineWidth(0.3);
      doc.line(ML,y,W-MR,y);
      ln(12);

      var firmY=y;
      doc.setDrawColor(DK[0],DK[1],DK[2]);
      doc.setLineWidth(0.3);
      doc.line(ML,firmY,ML+75,firmY);
      doc.line(colRight,firmY,W-MR,firmY);

      doc.setFont('helvetica','bold');
      doc.setFontSize(7.5);
      doc.setTextColor(DK[0],DK[1],DK[2]);
      doc.text('GreatPhones / Martín de Mendonça — DNI 45821618',ML,firmY+5);
      doc.text('Comprador — Aclaración y DNI:',colRight,firmY+5);

      ln(12);
      doc.setFont('helvetica','italic');
      doc.setFontSize(5.5);
      doc.setTextColor(GRAY[0],GRAY[1],GRAY[2]);
      doc.text('Al firmar, el comprador declara recibir el equipo en conformidad con lo descripto. GreatPhones · Zelarrayan 179, Bahía Blanca · 2914727351',W/2,y,{align:'center'});

      resolve(doc);
    });
  });
}

function descargarRecibo(){
  showToast('Generando recibo...','info');
  generarReciboPDF().then(function(doc){
    if(!doc){showToast('Error al generar recibo','error');return}
    var order=lastInstoreSaleData?lastInstoreSaleData.order:{};
    doc.save('Recibo_'+(order.code||'venta')+'.pdf');
    showToast('Recibo descargado','success');
  });
}

function imprimirRecibo(){
  showToast('Generando recibo para imprimir...','info');
  generarReciboPDF().then(function(doc){
    if(!doc){showToast('Error al generar recibo','error');return}
    var blob=doc.output('blob');
    var url=URL.createObjectURL(blob);
    var w=window.open(url,'_blank');
    if(w){
      w.onload=function(){w.print()};
    }else{
      showToast('Abrí el popup para imprimir','warning');
    }
  });
}

function enviarReciboPorEmail(){
  var email=prompt('Email destino para enviar el recibo:',lastInstoreSaleData&&lastInstoreSaleData.order?(lastInstoreSaleData.order.clientEmail||''):'');
  if(!email)return;
  showToast('Generando y enviando recibo...','info');
  generarReciboPDF().then(function(doc){
    if(!doc){showToast('Error al generar recibo','error');return}
    var pdfBase64=doc.output('datauristring');
    var orderCode=lastInstoreSaleData?lastInstoreSaleData.order.code:'';
    fetch(API_URL+'/api/admin/instore-sale/send-receipt',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-User-Id': currentUser.id},
      body:JSON.stringify({email:email,pdfBase64:pdfBase64,orderCode:orderCode})
    })
    .then(function(r){return r.json()})
    .then(function(data){
      if(data.success){showToast('Recibo enviado a '+email,'success')}
      else{showToast('Error: '+(data.error||'No se pudo enviar'),'error')}
    })
    .catch(function(){showToast('Error de conexión al enviar recibo','error')});
  });
}

function showSaleSuccess(order, change) {
  var modal = document.createElement('div')
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s'

  modal.innerHTML = `
    <div style="background:var(--cream2);border-radius:16px;max-width:450px;width:100%;padding:2.5rem;text-align:center;animation:scaleIn .3s">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;animation:scaleIn .35s">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 style="margin-bottom:0.5rem;font-size:24px;font-weight:700">¡Venta Exitosa!</h2>
      <p style="margin-bottom:1rem;color:var(--gray);font-size:14px">Orden: <strong style="color:var(--dk)">${order.code}</strong></p>
      
      ${change > 0 ? `
        <div style="background:rgba(45,90,39,.1);padding:1rem;border-radius:10px;margin-bottom:1rem">
          <div style="font-size:12px;color:var(--green);font-weight:600;margin-bottom:4px">Cambio a entregar</div>
          <div style="font-size:28px;font-weight:800;color:var(--green)">${(order.currency||'ARS') === 'USD' ? 'US$' : '$'}${change.toLocaleString('es-AR')}</div>
        </div>
      ` : ''}

      <div style="display:flex;gap:8px;margin-bottom:0.75rem">
        <button onclick="imprimirRecibo()" style="flex:1;padding:10px;font-size:12px;font-weight:600;background:var(--orange);color:#fff;border:none;border-radius:8px;cursor:pointer">
          🖨 Imprimir
        </button>
        <button onclick="descargarRecibo()" style="flex:1;padding:10px;font-size:12px;font-weight:600;background:var(--dk);color:#fff;border:none;border-radius:8px;cursor:pointer">
          📥 Descargar PDF
        </button>
      </div>
      <button onclick="enviarReciboPorEmail()" style="width:100%;padding:10px;font-size:12px;font-weight:600;background:#fff;color:var(--dk);border:1px solid var(--border);border-radius:8px;cursor:pointer;margin-bottom:1rem">
        📧 Enviar por mail
      </button>
      
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
    paymentType: null,
    installments: 1,
    currency: 'ARS',
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
      
      <div style="font-size:24px;font-weight:800;color:var(--orange);margin-bottom:0.5rem">${data.currency === 'USD' ? 'US$' : '$'}${data.amount.toLocaleString('es-AR')}</div>
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
      headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
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

  // Update lastInstoreSaleData with the confirmed order (for receipt generation)
  if (lastInstoreSaleData) {
    lastInstoreSaleData.order = order
    lastInstoreSaleData.currency = order.currency || lastInstoreSaleData.currency || 'ARS'
    lastInstoreSaleData.installments = order.cuotas || lastInstoreSaleData.installments || 1
  }

  modal.innerHTML = `
    <div style="background:var(--cream2);border-radius:16px;max-width:450px;width:100%;padding:2.5rem;text-align:center;animation:scaleIn .3s">
      <div style="width:80px;height:80px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;animation:scaleIn .35s">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 style="margin-bottom:0.5rem;font-size:24px;font-weight:700">¡Pago Confirmado!</h2>
      <p style="margin-bottom:1rem;color:var(--gray);font-size:14px">Orden: <strong style="color:var(--dk)">${order.code}</strong></p>

      <div style="display:flex;gap:8px;margin-bottom:0.75rem">
        <button onclick="imprimirRecibo()" style="flex:1;padding:10px;font-size:12px;font-weight:600;background:var(--orange);color:#fff;border:none;border-radius:8px;cursor:pointer">
          🖨 Imprimir
        </button>
        <button onclick="descargarRecibo()" style="flex:1;padding:10px;font-size:12px;font-weight:600;background:var(--dk);color:#fff;border:none;border-radius:8px;cursor:pointer">
          📥 Descargar PDF
        </button>
      </div>
      <button onclick="enviarReciboPorEmail()" style="width:100%;padding:10px;font-size:12px;font-weight:600;background:#fff;color:var(--dk);border:1px solid var(--border);border-radius:8px;cursor:pointer;margin-bottom:1rem">
        📧 Enviar por mail
      </button>

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
    paymentType: null,
    installments: 1,
    currency: 'ARS',
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

  fetch(url, { headers: { 'X-User-Id': currentUser.id } })
    .then(r => r.json())
    .then(res => {
      instoreHistoryOrders = res.data
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
    <div onclick="showInStoreSaleDetail('${order.id}')" style="background:white;padding:1rem;border-radius:10px;margin-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border);transition:all .2s;flex-wrap:wrap;gap:8px;cursor:pointer"
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

function showInStoreSaleDetail(orderId) {
  var order = instoreHistoryOrders ? instoreHistoryOrders.find(function(o){return o.id===orderId}) : null
  if (!order) return

  var itemsHtml = (order.items||[]).map(function(item){
    var name = item.customName || 'Producto #'+(item.productId||'')
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">'+
      '<span>'+name+' <span style="color:var(--gray)">x'+item.quantity+'</span></span>'+
      '<span style="font-weight:600">$'+(item.price*item.quantity).toLocaleString('es-AR')+'</span>'+
    '</div>'
  }).join('')

  var modal = document.createElement('div')
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s'

  var isPending = order.status === 'PENDING'

  modal.innerHTML = `
    <div style="background:var(--cream2);border-radius:16px;max-width:550px;width:100%;padding:2rem;animation:scaleIn .3s;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h2 style="font-size:20px;font-weight:700">${order.code}</h2>
        <button onclick="closeModal(this)" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--gray)">×</button>
      </div>

      <div style="font-size:12px;color:var(--gray);margin-bottom:1.5rem">${new Date(order.createdAt).toLocaleString('es-AR')}</div>

      ${isPending ? '<div style="background:rgba(255,107,44,.1);padding:0.75rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:12px;color:var(--orange);font-weight:600">⚠ Pendiente de pago — podés aprobar o cancelar esta venta</div>' : ''}

      <div style="margin-bottom:1rem">
        <div style="font-size:12px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:0.5rem">Productos</div>
        ${itemsHtml}
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:15px">
          <span>Total</span>
          <span style="color:var(--orange)">$${(order.total||0).toLocaleString('es-AR')}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;background:white;padding:1rem;border-radius:10px;border:1px solid var(--border)">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:0.5rem">Datos del Comprador</div>
          <div style="font-size:13px;margin-bottom:2px"><strong>Nombre:</strong> ${order.clientName||'—'}</div>
          <div style="font-size:13px;margin-bottom:2px"><strong>DNI:</strong> ${order.clientDni||'—'}</div>
          <div style="font-size:13px;margin-bottom:2px"><strong>CUIL:</strong> ${order.clientCuil||'—'}</div>
          <div style="font-size:13px;margin-bottom:2px"><strong>Tel:</strong> ${order.clientPhone||'—'}</div>
          <div style="font-size:13px;margin-bottom:2px"><strong>Domicilio:</strong> ${order.clientAddress||'—'}</div>
          <div style="font-size:13px"><strong>Email:</strong> ${order.clientEmail||'—'}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:0.5rem">Pago</div>
          <div style="font-size:13px;margin-bottom:2px"><strong>Método:</strong> ${order.payment||'—'}</div>
          ${order.payment==='Efectivo' ? '<div style="font-size:13px;margin-bottom:2px"><strong>Recibido:</strong> $'+(order.cashReceived||0).toLocaleString('es-AR')+'</div>' : ''}
          ${order.cashReceived ? '<div style="font-size:13px;margin-bottom:2px"><strong>Vuelto:</strong> $'+(order.change||0).toLocaleString('es-AR')+'</div>' : ''}
          <div style="font-size:13px;margin-top:4px"><strong>Estado:</strong> ${order.status==='DELIVERED'?'✅ Entregado':order.status==='PENDING'?'⏳ Pendiente':'❌ Cancelado'}</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${isPending ? `
          <button onclick="closeModal(this);confirmApproveSale('${order.id}')" class="btn btn-primary" style="flex:1;padding:12px;font-size:13px">✅ Aprobar venta</button>
          <button onclick="closeModal(this);confirmCancelSale('${order.id}')" class="btn btn-o" style="flex:1;padding:12px;font-size:13px;color:var(--red);border-color:var(--red)">❌ Cancelar venta</button>
        ` : order.status==='DELIVERED' ? `
          <button onclick="closeModal(this);showInStoreSaleReceipt('${order.id}')" class="btn btn-primary" style="flex:1;padding:12px;font-size:13px">🖨 Ver Recibo</button>
        ` : ''}
        <button onclick="closeModal(this)" class="btn btn-o" style="flex:1;padding:12px;font-size:13px">Cerrar</button>
      </div>
    </div>
  `

  document.body.appendChild(modal)
}

function closeModal(btn) {
  var el = btn.closest('div[style*="fixed"]')
  if (el) el.remove()
}

function confirmApproveSale(orderId) {
  if (!confirm('¿Aprobar esta venta? Se marcará como entregada.')) return
  document.querySelectorAll('div[style*="fixed"]').forEach(function(m){m.remove()})
  fetch(API_URL+'/api/admin/instore-sale/'+orderId+'/approve',{method:'POST',headers:{'X-User-Id':currentUser.id}})
  .then(function(r){return r.json()})
  .then(function(data){
    if(data.success){
      showToast('Venta aprobada','success')
      loadInStoreHistory()
    }else{
      showToast('Error: '+(data.error||'Error desconocido'),'error')
      loadInStoreHistory()
    }
  })
  .catch(function(){showToast('Error al aprobar la venta','error');loadInStoreHistory()})
}

function confirmCancelSale(orderId) {
  if (!confirm('¿Cancelar esta venta? Se devolverán los productos al stock.')) return
  document.querySelectorAll('div[style*="fixed"]').forEach(function(m){m.remove()})
  fetch(API_URL+'/api/admin/instore-sale/'+orderId+'/cancel',{method:'POST',headers:{'X-User-Id':currentUser.id}})
  .then(function(r){return r.json()})
  .then(function(data){
    if(data.success){
      showToast('Venta cancelada','success')
      loadInStoreHistory()
    }else{
      showToast('Error: '+(data.error||'Error desconocido'),'error')
      loadInStoreHistory()
    }
  })
  .catch(function(){showToast('Error al cancelar la venta','error');loadInStoreHistory()})
}

function showInStoreSaleReceipt(orderId) {
  var order = instoreHistoryOrders ? instoreHistoryOrders.find(function(o){return o.id===orderId}) : null
  if(!order) return
  var orderItems = (order.items||[]).map(function(oi){
    if(oi.productId){
      var p = (typeof PRODUCTS!=='undefined'&&PRODUCTS)?PRODUCTS.find(function(x){return x.id===oi.productId}):null
      return {
        type:'catalog',
        productId:oi.productId,
        name:p?(p.brand+' '+p.name):oi.customName||'',
        brand:p?p.brand:'',
        color:p?p.color:'',
        battery:p?(p.battery||''):'',
        storage:p?p.storage:'',
        imei:p?(p.imei||''):'',
        quantity:oi.quantity,
        price:oi.price
      }
    }
    return {
      type:'custom',
      name:oi.customName||'',
      quantity:oi.quantity,
      price:oi.price
    }
  })
  lastInstoreSaleData = {
    order: order,
    change: order.change || 0,
    items: orderItems,
    paymentMethod: order.payment==='Efectivo'?'cash':'transfer',
    cashReceived: order.cashReceived || 0
  }
  descargarRecibo()
}

// =========== PREEVENTAS (redirigido a la nueva sección) ===========
function renderPreOrders() {
  // Redirigir a la nueva sección de Preventas
  if (typeof adminTab === 'function') {
    adminTab('preventa', document.getElementById('adm-preventa'))
  }
}

function setPreFilterActive(f) {
  ['PENDING','CONFIRMED','all'].forEach(function(k){
    var b = document.getElementById('preFilter'+k)
    if (b) b.classList.toggle('ord-btn-act', k===f)
  })
}

function preOrderFilter(f) {
  window._preOrderFilter = f
  setPreFilterActive(f)
  loadPreOrders()
}

function preProductSearch(q) {
  var box = document.getElementById('pre-productResults')
  if (!box) return
  q = (q||'').toLowerCase().trim()
  if (!q) { box.style.display='none'; box.innerHTML=''; return }
  var matches = (window.PRODUCTS||[]).filter(function(p){
    return (p.name||'').toLowerCase().indexOf(q)>=0 || (p.sub||'').toLowerCase().indexOf(q)>=0
  }).slice(0,6)
  if (!matches.length) { box.style.display='none'; box.innerHTML=''; return }
  box.style.display='block'
  box.innerHTML = matches.map(function(p){
    return '<div onclick="selectPreProduct(\''+p.id+'\',\''+(p.name||'').replace(/'/g,"\\'")+'\')" style="padding:8px 10px;background:#fff;border:1px solid var(--border);border-radius:8px;margin-bottom:4px;cursor:pointer;font-size:12px" onmouseover="this.style.borderColor=\'var(--orange)\'" onmouseout="this.style.borderColor=\'var(--border)\'">'+
      '<span style="font-weight:600">'+(p.name||'')+'</span> <span style="color:var(--gray)">'+fmt(p.price)+'</span></div>'
  }).join('')
}

function selectPreProduct(id, name) {
  window._preSelectedProductId = id
  var search = document.getElementById('pre-productSearch')
  var box = document.getElementById('pre-productResults')
  var custom = document.getElementById('pre-customName')
  if (search) search.value = name
  if (box) { box.style.display='none'; box.innerHTML=''; }
  if (custom) custom.value = ''
  showToast('Producto seleccionado: '+name, 'success')
}

function createPreOrder() {
  var name = document.getElementById('pre-clientName').value.trim()
  var dni = document.getElementById('pre-clientDni').value.trim()
  var phone = document.getElementById('pre-clientPhone').value.trim()
  var email = document.getElementById('pre-clientEmail').value.trim()
  var productId = window._preSelectedProductId || null
  var customName = document.getElementById('pre-customName').value.trim()
  var customPrice = document.getElementById('pre-customPrice').value.trim()
  var notes = document.getElementById('pre-notes').value.trim()

  if (!name) { showToast('El nombre del cliente es obligatorio', 'error'); return }
  if (!productId && !customName) { showToast('Seleccioná un producto o ingresá un nombre', 'error'); return }

  var body = { clientName: name, clientDni: dni, clientPhone: phone, clientEmail: email, productId: productId, customName: customName, customPrice: customPrice?parseInt(customPrice):null, notes: notes }
  fetch(API_URL+'/api/admin/preorders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
    body: JSON.stringify(body)
  }).then(function(r){ return r.json(); }).then(function(res){
    if (res.error) { showToast(res.error, 'error'); return }
    showToast('Preeventa creada: '+res.code, 'success')
    // reset
    document.getElementById('pre-clientName').value=''
    document.getElementById('pre-clientDni').value=''
    document.getElementById('pre-clientPhone').value=''
    document.getElementById('pre-clientEmail').value=''
    document.getElementById('pre-productSearch').value=''
    document.getElementById('pre-customName').value=''
    document.getElementById('pre-customPrice').value=''
    document.getElementById('pre-notes').value=''
    window._preSelectedProductId = null
    loadPreOrders()
  }).catch(function(err){
    console.error('Error creating preorder:', err)
    showToast('Error al crear preeventa', 'error')
  })
}

function loadPreOrders() {
  var list = document.getElementById('preOrdersList')
  if (!list) return
  var f = window._preOrderFilter || 'PENDING'
  var url = API_URL + '/api/admin/preorders' + (f!=='all' ? '?status='+f : '')
  list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray)">Cargando...</div>'
  fetch(url, { headers: { 'X-User-Id': currentUser.id } }).then(function(r){ return r.json(); }).then(function(data){
    if (!Array.isArray(data) || !data.length) {
      list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray)"><div style="font-size:44px;margin-bottom:.5rem">📝</div><p>No hay preeventas'+(f!=='all'?' en este estado':'')+'</p></div>'
      return
    }
    list.innerHTML = data.map(function(o){
      var prodName = o.product ? o.product.name : (o.customName||'Producto custom')
      var prodImg = o.product && o.product.imageUrl ? '<img src="'+o.product.imageUrl+'" style="width:100%;height:100%;object-fit:cover">' : '<span style="font-size:26px">'+(o.product&&o.product.ico||'📦')+'</span>'
      var price = o.customPrice || (o.product ? o.product.price : 0)
      var statusColor = o.status==='PENDING'?'var(--orange)':o.status==='CONFIRMED'?'var(--green)':o.status==='SOLD'?'#009ee3':'var(--red)'
      var statusLabel = { PENDING:'Pendiente', CONFIRMED:'Confirmada', SOLD:'Vendida', CANCELLED:'Cancelada' }[o.status]||o.status
      return '<div style="background:#fff;border-radius:12px;padding:1rem;margin-bottom:.75rem;border:1px solid var(--border);display:flex;gap:12px;align-items:center;flex-wrap:wrap">'+
        '<div style="width:54px;height:54px;border-radius:10px;background:var(--cream2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center">'+prodImg+'</div>'+
        '<div style="flex:1;min-width:200px">'+
          '<div style="font-weight:700;font-size:14px">'+escapeHtml(prodName)+'</div>'+
          '<div style="font-size:12px;color:var(--gray)">'+escapeHtml(o.clientName||'')+(o.clientDni?' · DNI: '+escapeHtml(o.clientDni):'')+'</div>'+
          '<div style="font-size:11px;color:var(--gray)">'+o.code+' · '+(o.clientPhone||o.clientEmail||'')+'</div>'+
        '</div>'+
        '<div style="text-align:right;margin-right:1rem">'+
          '<div style="font-size:16px;font-weight:800;color:var(--orange)">'+(price>0?fmt(price):'—')+'</div>'+
          '<span style="font-size:10px;font-weight:600;padding:3px 8px;border-radius:10px;background:'+statusColor+'15;color:'+statusColor+'">'+statusLabel+'</span>'+
        '</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
          (o.status==='PENDING'?'<button onclick="updatePreOrderStatus(\''+o.id+'\',\'CONFIRMED\')" class="btn btn-g btn-sm">Confirmar</button>':'')+
          (o.status!=='SOLD'&&o.status!=='CANCELLED'?'<button onclick="convertPreOrderToSale(\''+o.id+'\')" class="btn btn-o btn-sm">Convertir a venta</button>':'')+
          (o.status!=='CANCELLED'&&o.status!=='SOLD'?'<button onclick="updatePreOrderStatus(\''+o.id+'\',\'CANCELLED\')" class="btn btn-sm" style="background:var(--red);color:#fff">Cancelar</button>':'')+
        '</div>'+
      '</div>'
    }).join('')
  }).catch(function(err){
    console.error('Error loading preorders:', err)
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--red)">Error al cargar preeventas</div>'
  })
}

function updatePreOrderStatus(id, status) {
  fetch(API_URL+'/api/admin/preorders/'+id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
    body: JSON.stringify({ status: status })
  }).then(function(r){ return r.json(); }).then(function(res){
    if (res.error) { showToast(res.error, 'error'); return }
    showToast('Preeventa actualizada', 'success')
    loadPreOrders()
  }).catch(function(err){
    console.error('Error updating preorder:', err)
    showToast('Error al actualizar', 'error')
  })
}

function convertPreOrderToSale(id) {
  fetch(API_URL+'/api/admin/preorders/'+id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
    body: JSON.stringify({ status: 'SOLD' })
  }).then(function(r){ return r.json(); }).then(function(res){
    if (res.error) { showToast(res.error, 'error'); return }
    // Pre-carga datos en la venta en tienda
    if (res.product) {
      instoreState.items = [{
        id: res.product.id,
        name: res.product.name,
        price: res.product.price,
        cost: res.product.cost || 0,
        quantity: 1,
        ico: res.product.ico,
        imageUrl: res.product.imageUrl
      }]
    }
    if (res.clientName) {
      var cn = document.getElementById('instore-clientName')
      if (cn) cn.value = res.clientName
      var cd = document.getElementById('instore-clientDni')
      if (cd && res.clientDni) cd.value = res.clientDni
      var cp = document.getElementById('instore-clientPhone')
      if (cp && res.clientPhone) cp.value = res.clientPhone
      var ce = document.getElementById('instore-clientEmail')
      if (ce && res.clientEmail) ce.value = res.clientEmail
    }
    showToast('Preeventa convertida — completá la venta', 'success')
    renderInStoreSale()
    window.scrollTo(0,0)
  }).catch(function(err){
    console.error('Error converting preorder:', err)
    showToast('Error al convertir', 'error')
  })
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
