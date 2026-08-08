// =========== COUPONS ===========
// Fuego & Papel — Coupon selection, display and management

var CPN = { coupons: [], selected: [], applied: [], discountTotal: 0 }

function cpnIco(name) {
  var icons = {
    ticket: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>',
    tags: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H2v7l6.29 6.29a1 1 0 0 0 1.42 0l5.58-5.58a1 1 0 0 0 0-1.42L9 5Z"/><path d="M6 9.01V9"/><path d="m15 5 6.3 6.3a1 1 0 0 1 0 1.42L14 19"/></svg>',
    gift: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    circle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    'ticket-x': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="m9.5 14.5 5-5"/><path d="m9.5 9.5 5 5"/></svg>',
    wallet: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>',
    'chevron-right': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    tag: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l6.58-6.58a1 1 0 0 0 0-1.42L12 2Z"/><path d="M7 7h.01"/></svg>'
  }
  return icons[name] || ''
}

function cpnFmt(amount) {
  return '$' + Number(amount).toLocaleString('es-AR')
}

function cpnFetchCoupons(statusFilter) {
  var q = statusFilter ? '?status=' + statusFilter : ''
  return fetch('/api/coupons' + q)
    .then(function(r) { return r.json() })
    .then(function(data) {
      if (data.error) throw new Error(data.error)
      CPN.coupons = data.coupons || data || []
      return CPN.coupons
    })
    .catch(function(e) {
      console.error('[Coupons] fetch error:', e)
      CPN.coupons = []
      return []
    })
}

function cpnUpdateCheckoutCard() {
  var el = document.getElementById('cpnCheckoutCard')
  var countEl = document.getElementById('cpnCouponCount')
  if (!countEl) return

  cpnFetchCoupons('ACTIVE').then(function(list) {
    var active = list.filter(function(c) { return c.remainingAmount > 0 })
    var n = active.length
    countEl.textContent = n + ' cupon' + (n !== 1 ? 'es' : '') + ' disponible' + (n !== 1 ? 's' : '')
    countEl.style.color = n > 0 ? 'var(--green)' : 'var(--gray2)'
    if (CPN.applied.length > 0) {
      countEl.textContent = CPN.applied.length + ' cupon' + (CPN.applied.length !== 1 ? 'es' : '') + ' aplicado' + (CPN.applied.length !== 1 ? 's' : '')
    }
  })
}

// =========== COUPON MODAL (Checkout) ===========

function cpnOpenModal() {
  cpnFetchCoupons('ACTIVE').then(function(list) {
    var active = list.filter(function(c) { return c.remainingAmount > 0 })
    CPN.coupons = active
    CPN.selected = CPN.applied.map(function(a) { return a.id })

    var existing = document.getElementById('cpnModal')
    if (existing) existing.remove()

    var overlay = document.createElement('div')
    overlay.id = 'cpnModal'
    overlay.className = 'cpn-modal-overlay'

    var hasCoupons = active.length > 0
    var discount = CPN.selected.reduce(function(sum, id) {
      var c = active.find(function(x) { return x.id === id })
      return sum + (c ? c.remainingAmount : 0)
    }, 0)
    CPN.discountTotal = discount

    var bodyHtml = ''
    if (!hasCoupons) {
      bodyHtml = '<div class="cpn-empty">' +
        '<div class="cpn-empty-icon">' + cpnIco('ticket-x') + '</div>' +
        '<div class="cpn-empty-txt">No tenés cupones activos</div>' +
        '<div class="cpn-empty-sub">Canjeá una Gift Card o vendé tu equipo para obtener cupones de descuento.</div>' +
        '<button class="cpn-empty-btn" onclick="cpnCloseModal()">Cerrar</button>' +
      '</div>'
    } else {
      bodyHtml = active.map(function(c, i) {
        var sel = CPN.selected.indexOf(c.id) > -1
        return '<div class="cpn-card' + (sel ? ' selected' : '') + '" data-id="' + c.id + '" onclick="cpnToggleCoupon(\'' + c.id + '\')" style="animation-delay:' + (i * 0.04) + 's">' +
          '<div class="cpn-card-strip"></div>' +
          '<div class="cpn-card-body">' +
            '<div class="cpn-card-info">' +
              '<div class="cpn-card-amount"><span class="cpn-card-currency">$</span>' + Number(c.originalAmount).toLocaleString('es-AR') + '</div>' +
              '<div class="cpn-card-code">' + (c.code || 'GP-XXXX-XXXX') + '</div>' +
              '<div class="cpn-card-meta">' +
                '<span class="cpn-card-meta-item">' + cpnIco('clock') + 'Vence ' + (c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-AR') : '—') + '</span>' +
              '</div>' +
              (c.source ? '<div class="cpn-card-source">' + cpnIco('tag') + ' ' + (c.source === 'giftcard' ? 'Canjeado de Gift Card' : c.source) + '</div>' : '') +
            '</div>' +
            '<div class="cpn-card-check">' + cpnIco('check') + '</div>' +
          '</div>' +
        '</div>'
      }).join('')
    }

    overlay.innerHTML =
      '<div class="cpn-modal">' +
        '<div class="cpn-modal-hdr">' +
          '<div class="cpn-modal-hdr-l">' +
            '<div class="cpn-modal-hdr-icon">' + cpnIco('tags') + '</div>' +
            '<div>' +
              '<h2>Tus cupones</h2>' +
              '<div class="cpn-modal-hdr-sub">Seleccioná los cupones para aplicar</div>' +
            '</div>' +
          '</div>' +
          '<button class="cpn-modal-close" onclick="cpnCloseModal()">' + cpnIco('x') + '</button>' +
        '</div>' +
        '<div class="cpn-modal-divider"></div>' +
        '<div class="cpn-modal-body">' + bodyHtml + '</div>' +
        (hasCoupons ? '<div class="cpn-modal-ftr">' +
          '<div class="cpn-modal-ftr-info">' +
            '<div class="cpn-modal-ftr-lbl">Descuento total</div>' +
            '<div class="cpn-modal-ftr-total' + (discount === 0 ? ' none' : '') + '" id="cpnModalTotal">' + (discount > 0 ? cpnFmt(discount) : '$0') + '</div>' +
          '</div>' +
          '<button class="cpn-modal-ftr-btn" id="cpnApplyBtn" onclick="cpnApplyCoupons()" ' + (discount === 0 ? 'disabled' : '') + '>' +
            (discount > 0 ? 'Aplicar ' + CPN.selected.length + ' cupon' + (CPN.selected.length !== 1 ? 'es' : '') : 'Seleccioná cupones') +
          '</button>' +
        '</div>' : '') +
      '</div>'

    // Delay click listener to prevent the opening click from closing the modal
    setTimeout(function() {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) cpnCloseModal()
      })
    }, 0)

    document.body.appendChild(overlay)
  })
}

function cpnCloseModal() {
  var el = document.getElementById('cpnModal')
  if (el) el.remove()
}

function cpnToggleCoupon(id) {
  var idx = CPN.selected.indexOf(id)
  if (idx > -1) {
    CPN.selected.splice(idx, 1)
  } else {
    CPN.selected.push(id)
  }

  var cards = document.querySelectorAll('#cpnModal .cpn-card')
  cards.forEach(function(card) {
    var cid = card.getAttribute('data-id')
    var sel = CPN.selected.indexOf(cid) > -1
    card.classList.toggle('selected', sel)
  })

  cpnUpdateModalFooter()
}

function cpnUpdateModalFooter() {
  var discount = CPN.selected.reduce(function(sum, id) {
    var c = CPN.coupons.find(function(x) { return x.id === id })
    return sum + (c ? c.remainingAmount : 0)
  }, 0)
  CPN.discountTotal = discount

  var totalEl = document.getElementById('cpnModalTotal')
  var btnEl = document.getElementById('cpnApplyBtn')
  if (totalEl) {
    totalEl.textContent = discount > 0 ? cpnFmt(discount) : '$0'
    totalEl.classList.toggle('none', discount === 0)
  }
  if (btnEl) {
    btnEl.disabled = discount === 0
    btnEl.textContent = discount > 0
      ? 'Aplicar ' + CPN.selected.length + ' cupon' + (CPN.selected.length !== 1 ? 'es' : '')
      : 'Seleccioná cupones'
  }
}

function cpnApplyCoupons() {
  if (CPN.selected.length === 0 || CPN.discountTotal === 0) return

  CPN.applied = CPN.selected.map(function(id) {
    var c = CPN.coupons.find(function(x) { return x.id === id })
    return c ? { id: c.id, code: c.code, amount: c.remainingAmount, originalAmount: c.originalAmount } : null
  }).filter(function(x) { return x })

  cpnCloseModal()
  cpnRenderAppliedCoupons()
  cpnUpdateCheckoutCard()
  if (typeof updateCheckoutTotal === 'function') updateCheckoutTotal()
}

function cpnRenderAppliedCoupons() {
  var container = document.getElementById('cpnAppliedContainer')
  if (!container) return

  if (CPN.applied.length === 0) {
    container.innerHTML = ''
    container.style.display = 'none'
    return
  }

  container.style.display = 'block'
  var totalDiscount = CPN.applied.reduce(function(s, c) { return s + c.amount }, 0)

  container.innerHTML =
    '<div class="cpn-discount-line">' +
      '<div class="cpn-discount-line-lbl">' +
        '<span>Descuento con cupones</span>' +
        '<button class="cpn-edit-btn" onclick="cpnOpenModal()">Editar</button>' +
        '<div class="cpn-applied-tags">' +
          CPN.applied.map(function(c) {
            return '<span class="cpn-applied-tag">' + cpnIco('tag') + c.code + '</span>'
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="cpn-discount-line-amount">-' + cpnFmt(totalDiscount) + '</div>' +
    '</div>'
}

// =========== CUENTA PAGE ===========

function cpnRenderCuentaSection(status) {
  status = status || 'ACTIVE'
  var container = document.getElementById('cpnCuentaContainer')
  if (!container) return

  container.innerHTML =
    '<div class="cpn-skeleton">' +
      '<div class="cpn-skeleton-item"></div>' +
      '<div class="cpn-skeleton-item"></div>' +
    '</div>'

  cpnFetchCoupons().then(function(list) {
    var filtered = list.filter(function(c) {
      if (status === 'ACTIVE') return c.status === 'ACTIVE' && c.remainingAmount > 0
      if (status === 'USED') return c.status === 'USED' || (c.status === 'ACTIVE' && c.remainingAmount <= 0)
      if (status === 'EXPIRED') return c.status === 'EXPIRED'
      return true
    })

    var hdrHtml =
      '<div class="cpn-section-hdr">' +
        '<div class="cpn-section-hdr-icon">' + cpnIco('tags') + '</div>' +
        '<h3>Mis Cupones <span class="cpn-section-count">(' + list.filter(function(c) { return c.status === 'ACTIVE' && c.remainingAmount > 0 }).length + ' activos)</span></h3>' +
      '</div>'

    var tabsHtml =
      '<div class="cpn-tabs">' +
        '<button class="cpn-tab' + (status === 'ACTIVE' ? ' act' : '') + '" onclick="cpnRenderCuentaSection(\'ACTIVE\')">Activos</button>' +
        '<button class="cpn-tab' + (status === 'USED' ? ' act' : '') + '" onclick="cpnRenderCuentaSection(\'USED\')">Usados</button>' +
        '<button class="cpn-tab' + (status === 'EXPIRED' ? ' act' : '') + '" onclick="cpnRenderCuentaSection(\'EXPIRED\')">Expirados</button>' +
      '</div>'

    var bodyHtml = ''
    if (filtered.length === 0) {
      bodyHtml =
        '<div class="cpn-empty">' +
          '<div class="cpn-empty-icon">' + cpnIco('ticket-x') + '</div>' +
          '<div class="cpn-empty-txt">No tenés cupones ' + status.toLowerCase() + '</div>' +
          '<div class="cpn-empty-sub">' +
            (status === 'ACTIVE'
              ? 'Canjeá una Gift Card para obtener cupones de descuento.'
              : 'Los cupones aparecen acá cuando los uses o venzan.') +
          '</div>' +
          (status === 'ACTIVE' ? '<button class="cpn-empty-btn" onclick="nav(\'shop\')">' + cpnIco('gift') + ' Canjear Gift Card</button>' : '') +
        '</div>'
    } else {
      bodyHtml = '<div class="cpn-grid">' +
        filtered.map(function(c) {
          var stripClass = c.status === 'USED' || (c.remainingAmount <= 0) ? ' used' : (c.status === 'EXPIRED' ? ' expired' : '')
          var badgeClass = c.status === 'ACTIVE' && c.remainingAmount > 0 ? 'cpn-badge-active' : (c.status === 'USED' || c.remainingAmount <= 0 ? 'cpn-badge-used' : 'cpn-badge-expired')
          var badgeText = c.status === 'ACTIVE' && c.remainingAmount > 0 ? 'Activo' : (c.status === 'USED' || c.remainingAmount <= 0 ? 'Usado' : 'Expirado')
          var displayAmount = c.originalAmount
          return '<div class="cpn-card">' +
            '<div class="cpn-card-strip' + stripClass + '"></div>' +
            '<div class="cpn-card-body">' +
              '<div class="cpn-card-info">' +
                '<div class="cpn-card-amount"><span class="cpn-card-currency">$</span>' + Number(displayAmount).toLocaleString('es-AR') + '</div>' +
                '<div class="cpn-card-code">' + (c.code || 'GP-XXXX-XXXX') + '</div>' +
                '<div class="cpn-card-meta">' +
                  (c.expiresAt && c.status === 'ACTIVE' ? '<span class="cpn-card-meta-item">' + cpnIco('clock') + 'Vence ' + new Date(c.expiresAt).toLocaleDateString('es-AR') + '</span>' : '') +
                  (c.usedAt ? '<span class="cpn-card-meta-item">' + cpnIco('tag') + 'Usado el ' + new Date(c.usedAt).toLocaleDateString('es-AR') + '</span>' : '') +
                  '<span class="cpn-badge ' + badgeClass + '">' + badgeText + '</span>' +
                '</div>' +
                (c.source ? '<div class="cpn-card-source">' + cpnIco('tag') + ' ' + (c.source === 'giftcard' ? 'Canjeado de Gift Card' : c.source) + '</div>' : '') +
              '</div>' +
            '</div>' +
          '</div>'
        }).join('') +
      '</div>'
    }

    container.innerHTML = hdrHtml + tabsHtml + bodyHtml
  })
}

function cpnRenderLegacyWallet(balance) {
  var container = document.getElementById('cpnLegacyWallet')
  if (!container) return
  if (!balance || balance <= 0) {
    container.innerHTML = ''
    container.style.display = 'none'
    return
  }
  container.style.display = 'block'
  container.innerHTML =
    '<div class="cpn-legacy-wallet">' +
      '<div class="cpn-legacy-wallet-icon">' + cpnIco('wallet') + '</div>' +
      '<div class="cpn-legacy-wallet-info">' +
        '<div class="cpn-legacy-wallet-lbl">Saldo en billetera</div>' +
        '<div class="cpn-legacy-wallet-val">' + cpnFmt(balance) + '</div>' +
        '<div class="cpn-legacy-wallet-sub">Saldo de ventas de equipos</div>' +
      '</div>' +
    '</div>'
}
