// =========== GIFT CARD ===========

function showGiftCard() {
  renderGiftModal()
}

function buyGiftCard(amount) {
  renderGiftModal(amount)
}

function renderGiftModal(presetAmount) {
  var existing = document.getElementById('gcModal')
  if (existing) existing.remove()

  var modal = document.createElement('div')
  modal.id = 'gcModal'
  modal.className = 'modal-overlay'
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s ease'

  var isCustom = presetAmount === 0
  var displayAmount = isCustom ? '' : (presetAmount || '50000')

  modal.innerHTML =
    '<div class="gc-modal" style="background:#fff;border-radius:24px;max-width:480px;width:100%;padding:2rem;position:relative;box-shadow:0 25px 80px rgba(0,0,0,.15);animation:modalIn .25s ease">' +
      '<button onclick="closeGiftModal()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:var(--gray);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background .15s" onmouseover="this.style.background=\'var(--cream)\'" onmouseout="this.style.background=\'transparent\'">&#10005;</button>' +
      '<div style="text-align:center;margin-bottom:1.5rem">' +
        '<div style="font-size:40px;margin-bottom:8px">&#127873;</div>' +
        '<h2 style="font-family:\'Playfair Display\',Georgia,serif;font-size:22px;color:var(--dk);margin-bottom:4px">Regalá tecnología</h2>' +
        '<p style="font-size:13px;color:var(--gray)">Elegí el monto y generamos un código único para regalar</p>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.25rem" id="gcPresets">' +
        [50000, 100000, 500000, 1000000, 2000000].map(function(amt) {
          var selected = presetAmount === amt ? 'gc-amt-act' : ''
          return '<button type="button" class="gc-amt ' + selected + '" onclick="selectGiftAmount(this,' + amt + ')" data-amt="' + amt + '">$' + amt.toLocaleString('es-AR') + '</button>'
        }).join('') +
        '<button type="button" class="gc-amt gc-amt-custom' + (isCustom ? ' gc-amt-act' : '') + '" onclick="selectGiftAmount(this,0)">Monto libre</button>' +
      '</div>' +
      '<div id="gcCustomInput" style="display:' + (isCustom ? 'block' : 'none') + ';margin-bottom:1rem">' +
        '<label style="font-size:12px;font-weight:600;color:var(--dk);display:block;margin-bottom:6px">Ingresá el monto</label>' +
        '<div style="display:flex;align-items:center;background:var(--cream);border:1.5px solid var(--border);border-radius:12px;padding:0 14px;transition:border-color .2s" id="gcCustomWrap">' +
          '<span style="font-size:16px;font-weight:600;color:var(--gray);margin-right:4px">$</span>' +
          '<input type="number" id="gcCustomAmount" class="inp-ghost" min="50000" max="3000000" step="5000" value="' + displayAmount + '" style="flex:1;border:none;background:transparent;padding:12px 0;font-size:15px;font-weight:600;outline:none" oninput="onGiftAmountChange(this.value)" placeholder="50000">' +
        '</div>' +
        '<div id="gcCustomError" style="font-size:11px;color:var(--red);margin-top:6px;display:none">El monto mínimo es $50.000 y el máximo $3.000.000</div>' +
      '</div>' +
      '<div style="margin-bottom:1rem">' +
        '<label style="font-size:12px;font-weight:600;color:var(--dk);display:block;margin-bottom:6px">Email del destinatario <span style="color:var(--gray);font-weight:400">(opcional)</span></label>' +
        '<input type="email" id="gcRecipientEmail" class="inp-f" placeholder="regalo@email.com" style="margin-bottom:0">' +
      '</div>' +
      '<div style="margin-bottom:1.5rem">' +
        '<label style="font-size:12px;font-weight:600;color:var(--dk);display:block;margin-bottom:6px">Mensaje <span style="color:var(--gray);font-weight:400">(opcional)</span></label>' +
        '<textarea id="gcMessage" class="inp-f" rows="2" placeholder="Feliz cumpleaños!..." style="resize:none;margin-bottom:0"></textarea>' +
      '</div>' +
      '<button class="btn btn-o btn-full" id="gcBuyBtn" onclick="purchaseGiftCard()">Comprar Gift Card</button>' +
      '<div id="gcBuyError" style="font-size:12px;color:var(--red);margin-top:10px;text-align:center;display:none"></div>' +
    '</div>'

  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeGiftModal()
  })

  document.body.appendChild(modal)
  updateGiftBuyButton()
}

var _selectedGiftAmount = null

function selectGiftAmount(btn, amount) {
  document.querySelectorAll('.gc-amt').forEach(function(el) { el.classList.remove('gc-amt-act') })
  btn.classList.add('gc-amt-act')
  _selectedGiftAmount = amount

  var customInput = document.getElementById('gcCustomInput')
  if (amount === 0) {
    customInput.style.display = 'block'
    document.getElementById('gcCustomAmount').focus()
  } else {
    customInput.style.display = 'none'
  }
  updateGiftBuyButton()
}

function onGiftAmountChange(value) {
  _selectedGiftAmount = 0
  document.querySelectorAll('.gc-amt').forEach(function(el) { el.classList.remove('gc-amt-act') })
  var customBtn = document.querySelector('.gc-amt-custom')
  if (customBtn) customBtn.classList.add('gc-amt-act')
  updateGiftBuyButton()
}

function getGiftAmount() {
  if (_selectedGiftAmount && _selectedGiftAmount > 0) return _selectedGiftAmount
  var input = document.getElementById('gcCustomAmount')
  if (!input) return null
  var val = parseInt(input.value)
  if (isNaN(val) || val < 50000 || val > 3000000) return null
  return val
}

function updateGiftBuyButton() {
  var btn = document.getElementById('gcBuyBtn')
  var errorEl = document.getElementById('gcCustomError')
  if (!btn) return

  var amt = getGiftAmount()
  if (amt) {
    btn.textContent = 'Comprar Gift Card — $' + amt.toLocaleString('es-AR')
    btn.disabled = false
    if (errorEl) errorEl.style.display = 'none'
  } else {
    btn.textContent = 'Comprar Gift Card'
    btn.disabled = true
    if (errorEl) {
      var input = document.getElementById('gcCustomAmount')
      if (input && input.value) {
        errorEl.style.display = 'block'
      } else {
        errorEl.style.display = 'none'
      }
    }
  }
}

function purchaseGiftCard() {
  var btn = document.getElementById('gcBuyBtn')
  var errorEl = document.getElementById('gcBuyError')
  if (!btn || btn.disabled) return

  var amount = getGiftAmount()
  if (!amount) return

  var recipientEmail = document.getElementById('gcRecipientEmail')?.value?.trim() || null
  var message = document.getElementById('gcMessage')?.value?.trim() || null

  btn.disabled = true
  btn.innerHTML = '<span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:6px"></span> Procesando...'
  if (errorEl) errorEl.style.display = 'none'

  fetch(API_URL+'/api/giftcard/preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amount,
      recipientEmail: recipientEmail,
      message: message
    })
  }).then(function(r) { return r.json() }).then(function(data) {
    if (data.error || !data.initPoint) throw new Error(data.error || 'Error al crear la Gift Card')
    window.location.href = data.initPoint
  }).catch(function(e) {
    btn.disabled = false
    btn.textContent = 'Comprar Gift Card'
    if (errorEl) {
      errorEl.textContent = e.message || 'Error al procesar la compra. Intentá nuevamente.'
      errorEl.style.display = 'block'
    }
  })
}

function closeGiftModal() {
  var modal = document.getElementById('gcModal')
  if (modal) modal.remove()
}

// =========== GIFT CARD REDEEM ===========

function renderRedeemSection(containerId) {
  var container = document.getElementById(containerId || 'walletRedeemSection')
  if (!container) return

  container.innerHTML =
    '<div class="redeem-card">' +
      '<div class="redeem-ico">&#127873;</div>' +
      '<div class="redeem-body">' +
        '<h4 class="redeem-title">¿Tenés una Gift Card?</h4>' +
        '<p class="redeem-desc">Ingresá el código y obtené un cupón de descuento al instante</p>' +
        '<div class="redeem-input-wrap">' +
          '<input type="text" class="redeem-input" id="redeemCodeInput" placeholder="GP-XXXX-XXXX" maxlength="11" style="text-transform:uppercase" oninput="onRedeemInput(this)" onkeydown="if(event.key===\'Enter\')redeemGiftCard()">' +
          '<button class="btn btn-o redeem-btn" id="redeemBtn" onclick="redeemGiftCard()" disabled>Canjear</button>' +
        '</div>' +
        '<div id="redeemStatus" style="font-size:12px;margin-top:8px;display:none"></div>' +
        '<div class="cpn-redeem-hint">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H2v7l6.29 6.29a1 1 0 0 0 1.42 0l5.58-5.58a1 1 0 0 0 0-1.42L9 5Z"/><path d="M6 9.01V9"/><path d="m15 5 6.3 6.3a1 1 0 0 1 0 1.42L14 19"/></svg>' +
          'Los cupones se aplican al pagar en el checkout' +
        '</div>' +
      '</div>' +
    '</div>'
}

var _redeemTimer = null

function onRedeemInput(input) {
  var val = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  input.value = val

  var btn = document.getElementById('redeemBtn')
  if (!btn) return

  var isValid = /^GP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(val)
  btn.disabled = !isValid

  var statusEl = document.getElementById('redeemStatus')
  if (statusEl) {
    statusEl.style.display = 'none'
    statusEl.className = ''
  }

  if (_redeemTimer) clearTimeout(_redeemTimer)

  if (val.length >= 4 && !isValid) {
    _redeemTimer = setTimeout(function() {
      checkGiftCode(val)
    }, 500)
  }
}

function checkGiftCode(code) {
  if (!code || code.length < 4) return
  var statusEl = document.getElementById('redeemStatus')
  if (!statusEl) return

  fetch('/api/giftcard/check?code=' + encodeURIComponent(code))
    .then(function(r) { return r.json() })
    .then(function(data) {
      if (!data.valid && data.error) {
        statusEl.textContent = data.error
        statusEl.className = 'redeem-status redeem-status-error'
        statusEl.style.display = 'block'
      } else if (data.valid) {
        statusEl.textContent = '✓ Gift Card válida por $' + data.amount.toLocaleString('es-AR')
        statusEl.className = 'redeem-status redeem-status-ok'
        statusEl.style.display = 'block'
      }
    })
    .catch(function(e) {
      console.error('Error checking gift card:',e);
      if (statusEl) {
        statusEl.textContent = 'Error al verificar la Gift Card. Intentá nuevamente.';
        statusEl.className = 'redeem-status redeem-status-error';
        statusEl.style.display = 'block';
      }
    });
}

function redeemGiftCard() {
  var input = document.getElementById('redeemCodeInput')
  var btn = document.getElementById('redeemBtn')
  var statusEl = document.getElementById('redeemStatus')

  if (!input || !btn) return
  var code = input.value.trim().toUpperCase()

  if (!/^GP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    if (statusEl) {
      statusEl.textContent = 'Formato inválido (GP-XXXX-XXXX)'
      statusEl.className = 'redeem-status redeem-status-error'
      statusEl.style.display = 'block'
    }
    return
  }

  btn.disabled = true
  btn.textContent = 'Canjeando...'
  if (statusEl) { statusEl.style.display = 'none' }

  fetch('/api/giftcard/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code })
  }).then(function(r) { return r.json() }).then(function(data) {
    if (data.error) throw new Error(data.error)

    // Success
    if (statusEl) {
      statusEl.textContent = '✅ ¡Gift card canjeada! Se generó un cupón de $' + data.amount.toLocaleString('es-AR') + '.'
      statusEl.className = 'redeem-status redeem-status-ok'
      statusEl.style.display = 'block'
    }
    btn.textContent = '✔ Canjeado'
    input.value = ''
    input.disabled = true

    setTimeout(function() {
      input.disabled = false
      btn.textContent = 'Canjear'
      btn.disabled = true
      if (statusEl) setTimeout(function() { statusEl.style.display = 'none' }, 5000)
    }, 3000)
  }).catch(function(e) {
    btn.disabled = false
    btn.textContent = 'Canjear'

    var messages = {
      429: 'Demasiados intentos. Esperá un minuto.',
      404: 'Código no encontrado. Verificá e intentá de nuevo.'
    }

    if (statusEl) {
      statusEl.textContent = messages[e.status] || e.message || 'Error al canjear. Intentá nuevamente.'
      statusEl.className = 'redeem-status redeem-status-error'
      statusEl.style.display = 'block'
    }
  })
}
