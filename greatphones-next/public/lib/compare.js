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
    container.innerHTML = '<p style="padding:8px;color:var(--gray);font-size:13px">No se encontraron productos</p>'
  } else {
    container.innerHTML = results.map(function(p) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px;cursor:pointer;border-radius:8px;transition:background .2s" onmouseover="this.style.background=\'var(--cream)\'" onmouseout="this.style.background=\'transparent\'" onclick="selectCompareDevice(' + slot + ', \'' + p.id + '\')">' +
        '<div style="width:50px;height:50px;border-radius:8px;background:var(--cream);overflow:hidden;flex-shrink:0">' +
          (p.imageUrl ? '<img src="' + p.imageUrl + '" style="width:100%;height:100%;object-fit:cover">' : '<span style="font-size:24px;display:flex;align-items:center;justify-content:center;height:100%">' + (p.ico || '📱') + '</span>') +
        '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.name + '</div>' +
          '<div style="font-size:11px;color:var(--gray)">' + p.brand + (p.storage ? ' · ' + p.storage : '') + '</div>' +
        '</div>' +
        '<div style="font-weight:700;color:var(--orange);font-size:14px">$' + p.price.toLocaleString('es-AR') + '</div>' +
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
  selectedEl.innerHTML = '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--cream);border-radius:12px;margin-top:12px">' +
    '<div style="width:60px;height:60px;border-radius:10px;background:#fff;overflow:hidden;flex-shrink:0">' +
      (device.imageUrl ? '<img src="' + device.imageUrl + '" style="width:100%;height:100%;object-fit:cover">' : '<span style="font-size:28px;display:flex;align-items:center;justify-content:center;height:100%">' + (device.ico || '📱') + '</span>') +
    '</div>' +
    '<div style="flex:1">' +
      '<div style="font-weight:700;font-size:14px">' + device.name + '</div>' +
      '<div style="font-size:12px;color:var(--gray)">' + device.brand + (device.storage ? ' · ' + device.storage : '') + '</div>' +
      '<div style="font-weight:700;color:var(--orange);font-size:16px;margin-top:4px">$' + device.price.toLocaleString('es-AR') + '</div>' +
    '</div>' +
    '<button onclick="clearCompareDevice(' + slot + ')" style="width:28px;height:28px;border-radius:50%;border:none;background:rgba(239,68,68,.1);color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center" onmouseover="this.style.background=\'var(--red)\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(239,68,68,.1)\';this.style.color=\'var(--red)\'">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '</button>' +
  '</div>'
  
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
      container.innerHTML = '<div style="text-align:center;padding:48px;background:#fff;border-radius:16px;border:2px dashed var(--border)">' +
        '<div style="font-size:48px;margin-bottom:16px">📊</div>' +
        '<p style="font-size:14px;color:var(--gray)">Seleccioná otro dispositivo para comparar</p>' +
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
  
  var html = '<div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid var(--border);box-shadow:0 4px 20px rgba(0,0,0,.08)">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:var(--cream);border-bottom:1px solid var(--border)">' +
      '<div style="padding:20px 24px;font-weight:700;font-size:14px;color:var(--gray)">Característica</div>' +
      '<div style="padding:20px 24px;font-weight:700;font-size:14px;text-align:center;border-left:1px solid var(--border)">' + d1.name + '</div>' +
      '<div style="padding:20px 24px;font-weight:700;font-size:14px;text-align:center;border-left:1px solid var(--border)">' + d2.name + '</div>' +
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
    
    var bg1 = better1 ? 'rgba(45,90,39,.08)' : 'transparent'
    var bg2 = better2 ? 'rgba(45,90,39,.08)' : 'transparent'
    var icon1 = better1 ? ' <span style="color:var(--green);font-size:12px">✓</span>' : ''
    var icon2 = better2 ? ' <span style="color:var(--green);font-size:12px">✓</span>' : ''
    
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;' + (i % 2 === 0 ? 'background:var(--cream)' : 'background:#fff') + '">' +
      '<div style="padding:16px 24px;font-size:13px;font-weight:600;color:var(--dk);display:flex;align-items:center">' + comp.label + '</div>' +
      '<div style="padding:16px 24px;font-size:13px;text-align:center;border-left:1px solid var(--border);background:' + bg1 + '">' + displayV1 + icon1 + '</div>' +
      '<div style="padding:16px 24px;font-size:13px;text-align:center;border-left:1px solid var(--border);background:' + bg2 + '">' + displayV2 + icon2 + '</div>' +
    '</div>'
  })
  
  html += '</div>'
  container.innerHTML = html
}

function parseRAM(val) {
  if (!val || val === '-') return 0
  var match = val.toString().match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}
