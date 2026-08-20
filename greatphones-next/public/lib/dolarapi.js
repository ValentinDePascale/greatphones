// =========== DOLAR API (dolarapi.com) ===========
// Obtiene el tipo de cambio del dólar oficial (venta) para convertir precios
// en ARS a USD en el panel de administración. Caché en memoria para no
// repetir la petición en cada render.
window.dolarRate = 0
window.dolarInfo = null
var _dolarLastFetch = 0
var _dolarPromise = null

// Fuerza re-consulta aunque haya caché (por si pasó mucho tiempo)
function refreshDolarRate() {
  _dolarLastFetch = 0
  return loadDolarRate()
}

// Carga la cotización (con caché de 10 min)
function loadDolarRate() {
  if (window.dolarRate > 0 && (Date.now() - _dolarLastFetch) < 600000) {
    return Promise.resolve(window.dolarRate)
  }
  if (_dolarPromise && (Date.now() - _dolarLastFetch) < 60000) {
    return _dolarPromise
  }
  _dolarPromise = fetch('https://dolarapi.com/v1/dolares/oficial', { cache: 'no-store' })
    .then(function (r) { return r.json() })
    .then(function (data) {
      if (data && data.venta > 0) {
        window.dolarRate = data.venta
        window.dolarInfo = data
        _dolarLastFetch = Date.now()
        // Reflejar el valor en el input manual del admin si está visible
        var inp = document.getElementById('adminDolarRate')
        if (inp && !parseFloat(localStorage.getItem('dolarRate'))) inp.value = data.venta
        // Redibujar los precios del admin si están visibles
        if (window.currentAdminTab === 'prods' && typeof renderAdminProductsFiltered === 'function') {
          var s = document.getElementById('adminProdSearch')
          renderAdminProductsFiltered(s ? s.value : '')
        }
        if (window.currentAdminTab === 'acc' && typeof renderAdminAccFiltered === 'function') {
          renderAdminAccFiltered('')
        }
      }
      return window.dolarRate
    })
    .catch(function () { return window.dolarRate || 0 })
    .finally(function () { _dolarPromise = null })
  return _dolarPromise
}
