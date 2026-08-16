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
