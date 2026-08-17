// =========== COMPARE DEVICES ===========
var compareState = {
  device1: null,
  device2: null,
  searchResults1: [],
  searchResults2: []
}

function searchCompareDevice(slot, query) {
  if (!query || query.length < 2) {
    document.getElementById('compare-results-' + slot).style.display = 'none'
    return
  }
  
  var results = PRODUCTS.filter(function(p) {
    return p.name.toLowerCase().includes(query.toLowerCase()) ||
           p.brand.toLowerCase().includes(query.toLowerCase()) ||
           (p.sub && p.sub.toLowerCase().includes(query.toLowerCase()))
  }).slice(0, 8)
  
  if (slot === 1) compareState.searchResults1 = results
  else compareState.searchResults2 = results
  
  var container = document.getElementById('compare-results-' + slot)
  if (results.length === 0) {
    container.innerHTML = '<div class="cmp-res-empty">No se encontraron productos</div>'
  } else {
    container.innerHTML = results.map(function(p) {
      var thumb = p.imageUrl
        ? '<img src="' + p.imageUrl + '" alt="">'
        : '<span class="cmp-res-thumb"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg></span>';
      return '<div class="cmp-res-item" role="option" onclick="selectCompareDevice(' + slot + ', \'' + p.id + '\')">' +
        thumb +
        '<div class="cmp-res-info">' +
          '<div class="cmp-res-name">' + p.name + '</div>' +
          '<div class="cmp-res-sub">' + p.brand + (p.storage ? ' · ' + p.storage : '') + '</div>' +
        '</div>' +
        '<div class="cmp-res-price">$' + p.price.toLocaleString('es-AR') + '</div>' +
      '</div>'
    }).join('')
  }
  container.style.display = 'block'
}

function selectCompareDevice(slot, productId) {
  var device = PRODUCTS.find(function(p) { return p.id === productId })
  if (!device) return
  
  if (slot === 1) compareState.device1 = device
  else compareState.device2 = device
  
  // Ocultar resultados
  document.getElementById('compare-results-' + slot).style.display = 'none'
  document.getElementById('compare-search-' + slot).value = ''
  
  // Mostrar seleccionado
  var selectedEl = document.getElementById('compare-selected-' + slot)
  var thumb = device.imageUrl
    ? '<img src="' + device.imageUrl + '" alt="' + device.name + '">'
    : '<span class="cmp-selected-thumb"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg></span>';
  selectedEl.innerHTML = '<div class="cmp-selected-card">' +
    thumb +
    '<div class="cmp-selected-info">' +
      '<div class="cmp-selected-name">' + device.name + '</div>' +
      '<div class="cmp-selected-sub">' + device.brand + (device.storage ? ' · ' + device.storage : '') + '</div>' +
      '<div class="cmp-selected-price">$' + device.price.toLocaleString('es-AR') + '</div>' +
    '</div>' +
    '<button class="cmp-selected-remove" onclick="clearCompareDevice(' + slot + ')" aria-label="Quitar ' + device.name + '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '</button>' +
  '</div>'

  if (window.GPAnim && window.GPAnim.revealAll) window.GPAnim.revealAll('.cmp-selected-card')
  
  renderComparisonTable()
}

function clearCompareDevice(slot) {
  if (slot === 1) compareState.device1 = null
  else compareState.device2 = null
  
  document.getElementById('compare-selected-' + slot).innerHTML = ''
  renderComparisonTable()
}

function swapCompareDevices() {
  var temp = compareState.device1
  compareState.device1 = compareState.device2
  compareState.device2 = temp
  
  // Re-render selected
  if (compareState.device1) selectCompareDevice(1, compareState.device1.id)
  else document.getElementById('compare-selected-1').innerHTML = ''
  
  if (compareState.device2) selectCompareDevice(2, compareState.device2.id)
  else document.getElementById('compare-selected-2').innerHTML = ''
}

function clearCompare() {
  compareState.device1 = null
  compareState.device2 = null
  document.getElementById('compare-selected-1').innerHTML = ''
  document.getElementById('compare-selected-2').innerHTML = ''
  document.getElementById('compare-search-1').value = ''
  document.getElementById('compare-search-2').value = ''
  document.getElementById('compare-results-1').style.display = 'none'
  document.getElementById('compare-results-2').style.display = 'none'
  document.getElementById('compare-table-container').innerHTML = ''
}

function renderComparisonTable() {
  var container = document.getElementById('compare-table-container')
  if (!compareState.device1 || !compareState.device2) {
    if (compareState.device1 || compareState.device2) {
      container.innerHTML = '<div class="cmp-empty">' +
        '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>' +
        '<p>Seleccioná otro dispositivo para comparar</p>' +
      '</div>'
    } else {
      container.innerHTML = ''
    }
    return
  }
  
  var d1 = compareState.device1
  var d2 = compareState.device2
  
  var isPhone = d1.type === 'celular' && d2.type === 'celular'
  var isComputer = (d1.type === 'laptop' || d1.type === 'desktop') && (d2.type === 'laptop' || d2.type === 'desktop')

  var comparisons = [
    { label: 'Marca', v1: d1.brand, v2: d2.brand, type: 'text' },
    { label: 'Modelo', v1: d1.name, v2: d2.name, type: 'text' },
    { label: 'Almacenamiento', v1: d1.storage || '-', v2: d2.storage || '-', type: 'text' },
    { label: 'RAM', v1: d1.ram || '-', v2: d2.ram || '-', type: 'number', higher: true, parse: parseRAM },
    { label: 'Pantalla', v1: d1.screen, v2: d2.screen, type: 'number', higher: true, suffix: '"' },
    { label: 'Procesador', v1: d1.processor || '-', v2: d2.processor || '-', type: 'text', skip: isPhone },
    { label: 'Batería', v1: d1.battery, v2: d2.battery, type: 'number', higher: true, suffix: '%', skip: isComputer },
    { label: 'Condición', v1: d1.condition || '-', v2: d2.condition || '-', type: 'text' },
    { label: 'Color', v1: d1.color || '-', v2: d2.color || '-', type: 'text' },
    { label: 'Precio', v1: d1.price, v2: d2.price, type: 'number', higher: false, format: 'money' },
    { label: 'Stock', v1: d1.stock, v2: d2.stock, type: 'number', higher: true },
  ].filter(function(c) { return !c.skip })
  
  var html = '<div class="cmp-table">' +
    '<div class="cmp-t cmp-t-head">' +
      '<div class="cmp-t-label">Característica</div>' +
      '<div class="cmp-t-val cmp-t-val--name">' + d1.name + '</div>' +
      '<div class="cmp-t-val cmp-t-val--name">' + d2.name + '</div>' +
    '</div>'

  comparisons.forEach(function(comp, i) {
    var v1 = comp.v1
    var v2 = comp.v2
    var better1 = false
    var better2 = false
    
    if (comp.type === 'number' && v1 !== null && v1 !== undefined && v1 !== '-' && v2 !== null && v2 !== undefined && v2 !== '-') {
      var num1 = comp.parse ? comp.parse(v1) : v1
      var num2 = comp.parse ? comp.parse(v2) : v2
      if (comp.higher) {
        if (num1 > num2) better1 = true
        else if (num2 > num1) better2 = true
      } else {
        if (num1 < num2) better1 = true
        else if (num2 < num1) better2 = true
      }
    }
    
    var displayV1 = comp.format === 'money' ? '$' + v1.toLocaleString('es-AR') : (v1 + (comp.suffix || ''))
    var displayV2 = comp.format === 'money' ? '$' + v2.toLocaleString('es-AR') : (v2 + (comp.suffix || ''))

    html += '<div class="cmp-t cmp-t-row' + (i % 2 === 0 ? '' : ' cmp-t-row--alt') + '">' +
      '<div class="cmp-t-label">' + comp.label + '</div>' +
      '<div class="cmp-t-val' + (better1 ? ' cmp-t-win' : '') + '">' + displayV1 + (better1 ? '<span class="cmp-win-ico" aria-label="Mejor valor">✓</span>' : '') + '</div>' +
      '<div class="cmp-t-val' + (better2 ? ' cmp-t-win' : '') + '">' + displayV2 + (better2 ? '<span class="cmp-win-ico" aria-label="Mejor valor">✓</span>' : '') + '</div>' +
    '</div>'
  })
  
  html += '</div>'
  container.innerHTML = html

  if (window.GPAnim && window.GPAnim.revealAll) window.GPAnim.revealAll('.cmp-t-row')
}

function parseRAM(val) {
  if (!val || val === '-') return 0
  var match = val.toString().match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}

// Entrada suave del header y los slots al abrir /compare (solo presentacional).
document.addEventListener('DOMContentLoaded', function(){
  if (window.GPAnim && window.GPAnim.revealAll) {
    window.GPAnim.revealAll('.compare-hdr, .cmp-slot, .compare-cta')
  }
})
