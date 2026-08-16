/**
 * Fetch wrapper centralizado para Great Phones.
 *
 * Garantiza que TODA llamada al backend envie cookies (credentials: 'include')
 * para que el session cookie gp-session funcione correctamente — incluyendo
 * cuando la app se sirve desde un origen distinto al del backend (ej. tunel
 * HTTPS de Cloudflare apuntando a localhost).
 *
 * Ademas:
 * - Normaliza el Content-Type para POST/PUT/PATCH con body.
 * - Parsea JSON automaticamente.
 * - En 401 redirige a /login (excepto en endpoints de auth que daran 401 legitimo).
 * - Lanza un error con .status y .body para que el caller lo maneje.
 *
 * Uso:
 *   const data = await gpFetch('/api/auth/signin', { method:'POST', body:{ email, password } })
 *   const data = await gpFetch('/api/products?limit=10')
 */
(function attachGpFetch() {
  if (typeof window === 'undefined') return
  if (window.gpFetch) return // idempotente

  var API_URL = window.API_URL
    || (window.location.hostname === 'localhost'
      ? (window.location.protocol + '//' + window.location.host)
      : window.location.origin)

  function isAuthEndpoint(url) {
    return /\/api\/auth\/(signin|signup|forgot-password|reset-password|verify-email|csrf|signout|logout)/.test(url)
  }

  function normalizeUrl(url) {
    if (/^https?:\/\//i.test(url)) return url
    if (url.charAt(0) !== '/') url = '/' + url
    return API_URL + url
  }

  function gpFetch(url, options) {
    options = options || {}
    var init = {
      credentials: 'include',
      method: options.method || 'GET',
      headers: Object.assign({}, options.headers || {})
    }

    var body = options.body
    if (body != null && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
      init.body = JSON.stringify(body)
      init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json'
    } else if (body != null) {
      init.body = body
    }

    var fullUrl = normalizeUrl(url)

    return fetch(fullUrl, init).then(function (res) {
      var contentType = res.headers.get('content-type') || ''
      var isJson = contentType.indexOf('application/json') !== -1
      var parsed = isJson ? res.json().catch(function () { return null }) : res.text()

      return Promise.resolve(parsed).then(function (data) {
        if (!res.ok) {
          // 401 en endpoints NO-auth: sesion expirada o cookie no enviada.
          // Redirigir a /login para que el usuario re-autentique.
          if (res.status === 401 && !isAuthEndpoint(url) && typeof window !== 'undefined') {
            try {
              // Solo redirigir si no estamos ya en /login para evitar loops.
              if (window.location.pathname !== '/login' && window.location.pathname !== '/cuenta') {
                window.location.href = '/login?expired=1'
              }
            } catch (_) {}
          }
          var err = new Error((data && (data.error || data.message)) || ('HTTP ' + res.status))
          err.status = res.status
          err.body = data
          throw err
        }
        return data
      })
    })
  }

  window.gpFetch = gpFetch
})()
