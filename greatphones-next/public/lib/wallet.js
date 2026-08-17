// =========== WALLET ===========

var WALLET_CACHE = null

function getWallet() {
  return window.gpFetch('/api/wallet')
    .then(function(data) {
      if (data && data.error) throw new Error(data.error)
      WALLET_CACHE = data
      return data
    })
}

function updateWalletUI() {
  var el = document.getElementById('cuentaSaldo')
  getWallet().then(function(w) {
    if (el) {
      var current = parseInt(el.textContent.replace(/\./g, '')) || 0
      animateCounter(el, current, w.balance, 800)
    }
  }).catch(function() {
    if (el) el.textContent = '0'
  })
}

function getWalletTransactions(page, limit) {
  page = page || 1
  limit = limit || 20
  return window.gpFetch('/api/wallet/transactions?page=' + page + '&limit=' + limit)
}

function renderWalletTransactions(page) {
  page = page || 1
  var container = document.getElementById('walletTransactions')
  if (!container) return

  container.innerHTML = '<div class="tx-loading"><div class="spinner" style="width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--orange);border-radius:50%;animation:spin .6s linear infinite;margin:0 auto"></div></div>'

  getWalletTransactions(page).then(function(data) {
    if (!data.transactions || data.transactions.length === 0) {
      container.innerHTML =
        '<div class="tx-empty">' +
          '<div class="tx-empty-ico">&#128179;</div>' +
          '<p class="tx-empty-txt">Todavía no tenés movimientos</p>' +
          '<p class="tx-empty-sub">El saldo aparece cuando canjees una Gift Card o vendas tu equipo</p>' +
        '</div>'
      return
    }

    var html = ''
    data.transactions.forEach(function(tx) {
      var isPositive = tx.amount > 0
      var sign = isPositive ? '+' : ''
      var typeLabels = {
        GIFT_CARD_REDEEM: 'Canje de Gift Card',
        PAYMENT: 'Pago de compra',
        REFUND: 'Reembolso',
        DEPOSIT: 'Depósito',
        WITHDRAWAL: 'Retiro',
        ADMIN_ADJUST: 'Ajuste administrativo'
      }
      var typeIcons = {
        GIFT_CARD_REDEEM: '🎁',
        PAYMENT: '🛒',
        REFUND: '↩️',
        DEPOSIT: '💰',
        WITHDRAWAL: '🏧',
        ADMIN_ADJUST: '⚙️'
      }
      var date = new Date(tx.createdAt)
      var dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

      html +=
        '<div class="tx-row">' +
          '<div class="tx-ico">' + (typeIcons[tx.type] || '💳') + '</div>' +
          '<div class="tx-info">' +
            '<div class="tx-label">' + (typeLabels[tx.type] || tx.type) + '</div>' +
            '<div class="tx-desc">' + (tx.description || '') + '</div>' +
            '<div class="tx-date">' + dateStr + '</div>' +
          '</div>' +
          '<div class="tx-amount ' + (isPositive ? 'tx-plus' : 'tx-minus') + '">' + sign + '$' + Math.abs(tx.amount).toLocaleString('es-AR') + '</div>' +
        '</div>'
    })

    container.innerHTML = html

    if (data.totalPages > 1) {
      var pagHtml = '<div class="tx-pages">'
      for (var i = 1; i <= data.totalPages; i++) {
        pagHtml += '<button class="tx-page' + (i === page ? ' tx-page-act' : '') + '" onclick="renderWalletTransactions(' + i + ')">' + i + '</button>'
      }
      pagHtml += '</div>'
      container.innerHTML += pagHtml
    }
  }).catch(function() {
    container.innerHTML =
      '<div class="tx-error">' +
        '<p>Error al cargar movimientos</p>' +
        '<button class="btn btn-sm" onclick="renderWalletTransactions(' + page + ')">Reintentar</button>' +
      '</div>'
  })
}

function animateCounter(el, from, to, duration) {
  var start = performance.now()
  var range = to - from

  function step(now) {
    var elapsed = now - start
    var progress = Math.min(elapsed / duration, 1)
    var eased = 1 - Math.pow(1 - progress, 3)
    var current = Math.round(from + range * eased)
    el.textContent = current.toLocaleString('es-AR')
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

// =========== RETIRAR PLATA ===========
function openWithdrawModal() {
  if (!currentUser) { showToast('Iniciá sesión para retirar'); return }
  var existing = document.getElementById('withdrawModal')
  if (existing) existing.remove()

  getWallet().then(function(w) {
    var balance = w.balance || 0
    var overlay = document.createElement('div')
    overlay.id = 'withdrawModal'
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center'
    overlay.innerHTML =
      '<div style="position:absolute;inset:0;background:rgba(0,0,0,.5)" onclick="document.getElementById(\'withdrawModal\').remove()"></div>' +
      '<div style="position:relative;background:#fff;border-radius:20px;width:min(400px,92vw);padding:1.5rem;box-shadow:0 20px 60px rgba(0,0,0,.3);z-index:1">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">' +
          '<div style="font-size:18px;font-weight:700;color:var(--dk)">Retirar saldo</div>' +
          '<button onclick="document.getElementById(\'withdrawModal\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--gray);line-height:1">&times;</button>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--gray);margin-bottom:1rem;line-height:1.5">Saldo disponible: <strong style="color:var(--dk)">$' + balance.toLocaleString('es-AR') + '</strong><br>El retiro se coordina por transferencia bancaria con nuestro equipo.</p>' +
        '<label style="font-size:12px;font-weight:600;color:var(--dk);display:block;margin-bottom:6px">Monto a retirar</label>' +
        '<div style="display:flex;align-items:center;background:var(--cream);border:1.5px solid var(--border);border-radius:12px;padding:0 14px;margin-bottom:8px">' +
          '<span style="font-size:16px;font-weight:600;color:var(--gray);margin-right:6px">$</span>' +
          '<input type="number" id="withdrawAmount" min="1000" max="' + balance + '" step="1000" placeholder="' + Math.min(1000, balance) + '" style="flex:1;border:none;background:transparent;padding:12px 0;font-size:16px;font-weight:600;outline:none;font-family:inherit">' +
        '</div>' +
        '<div id="withdrawError" style="font-size:12px;color:var(--red);margin-bottom:10px;display:none"></div>' +
        '<button onclick="submitWithdraw()" style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--orange) 0%,#e55a1a 100%);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Confirmar retiro</button>' +
      '</div>'
    document.body.appendChild(overlay)
    setTimeout(function(){ var i = document.getElementById('withdrawAmount'); if (i) i.focus() }, 50)
  }).catch(function() {
    showToast('No se pudo cargar tu saldo')
  })
}

function submitWithdraw() {
  var input = document.getElementById('withdrawAmount')
  var errEl = document.getElementById('withdrawError')
  if (!input) return
  var amount = parseInt(input.value)
  if (errEl) errEl.style.display = 'none'
  if (!amount || amount < 1000) {
    if (errEl) { errEl.textContent = 'El monto mínimo es $1.000'; errEl.style.display = 'block' }
    return
  }

  var btn = document.querySelector('#withdrawModal button[onclick="submitWithdraw()"]')
  if (btn) { btn.disabled = true; btn.textContent = 'Procesando...' }

  window.gpFetch('/api/wallet/withdraw', { method: 'POST', body: { amount: amount } })
    .then(function(data) {
      if (data.error) throw new Error(data.error)
      var modal = document.getElementById('withdrawModal')
      if (modal) modal.remove()
      showToast({ title: 'Retiro registrado', message: data.message, type: 'success' })
      updateWalletUI()
      if (typeof renderWalletTransactions === 'function') renderWalletTransactions(1)
      if (typeof refreshCuentaPanels === 'function') refreshCuentaPanels()
      else if (typeof updateWalletUI === 'function') updateWalletUI()
    })
    .catch(function(e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Confirmar retiro' }
      if (errEl) { errEl.textContent = (e && e.body && e.body.error) || e.message || 'Error al procesar el retiro'; errEl.style.display = 'block' }
    })
}
