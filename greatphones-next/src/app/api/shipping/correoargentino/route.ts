import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIpKey } from '@/lib/rate-limit'

// ============================================================
// Correo Argentino — API real de PAQ.AR MiCorreo
// Docs: https://www.correoargentino.com.ar/MiCorreo/public/mi-correo
//
// Endpoints de la API real:
//   POST /micorreo/v1/token    (Basic Auth)  -> { token }
//   POST /micorreo/v1/rates    (Bearer)      -> { rates: [{deliveredType, productType, productName, price, deliveryTimeMin, deliveryTimeMax}] }
//   GET  /micorreo/v1/agencies (Bearer)      -> puntos de entrega / sucursales habilitadas
//
// La API real cotiza dos modalidades de entrega, controladas por
// "deliveredType":
//   'D' -> Entrega a domicilio
//   'S' -> Retiro en punto de entrega / sucursal (Punto Correo, sucursal)
//
// Este endpoint cotiza AMBAS modalidades (D y S) llamando dos veces a
// /rates, y además intenta traer la lista de puntos de entrega (agencias)
// para la opción de retiro en sucursal.
// ============================================================

const CA_API_BASE =
  process.env.CORREO_ARGENTINO_TEST === 'true'
    ? 'https://apitest.correoargentino.com.ar/micorreo/v1'
    : 'https://api.correoargentino.com.ar/micorreo/v1'

const CA_USER = process.env.CORREO_ARGENTINO_USER || ''
const CA_PASS = process.env.CORREO_ARGENTINO_PASS || ''
const CA_CUSTOMER_ID = process.env.CORREO_ARGENTINO_CUSTOMER_ID || ''

const CA_CP_ORIGEN = '8000'

let cachedToken = ''
let tokenExpiresAt = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const basic = Buffer.from(`${CA_USER}:${CA_PASS}`).toString('base64')

  const res = await fetch(`${CA_API_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  if (!res.ok) {
    throw new Error(`Correo Argentino auth failed: ${res.status}`)
  }

  const data = await res.json()
  cachedToken = data.token || ''
  tokenExpiresAt = Date.now() + 55 * 60 * 1000
  return cachedToken
}

async function fetchRates(token: string, cpDestino: string, tipoEnvio: string, dims: any): Promise<any[]> {
  const res = await fetch(`${CA_API_BASE}/rates`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId: CA_CUSTOMER_ID,
      postalCodeOrigin: CA_CP_ORIGEN,
      postalCodeDestination: cpDestino,
      deliveredType: tipoEnvio, // 'D' = domicilio, 'S' = sucursal/punto de entrega
      dimensions: dims,
    }),
  })

  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data?.rates) ? data.rates : []
}

async function fetchAgencies(token: string): Promise<any[]> {
  try {
    const res = await fetch(`${CA_API_BASE}/agencies`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    const list = Array.isArray(data) ? data : data?.agencies || data?.data || []
    return list
  } catch {
    return []
  }
}

function buildFallbackOptions(destZip: string) {
  const zona = destZip.startsWith('8') ? 'bahia' : 'interior'
  const base = zona === 'bahia' ? 3500 : 7500

  return {
    success: true,
    live: false,
    fallback: false,
    note: 'Costos estimados. Configure CORREO_ARGENTINO_USER, CORREO_ARGENTINO_PASS y CORREO_ARGENTINO_CUSTOMER_ID para cotizar en tiempo real.',
    modalidades: [
      {
        tipoEnvio: 'D',
        label: 'Entrega a domicilio',
        options: [
          {
            carrier: 'Correo Argentino',
            service: 'Correo Argentino Clásico',
            costo: Math.round(base),
            diasEstimados: zona === 'bahia' ? '48-72hs' : '4-7 días hábiles',
            peso: 1,
            live: false,
          },
          {
            carrier: 'Correo Argentino',
            service: 'Correo Argentino Expreso',
            costo: Math.round(base * 1.5),
            diasEstimados: zona === 'bahia' ? '24-48hs' : '2-4 días hábiles',
            peso: 1,
            live: false,
          },
        ],
      },
      {
        tipoEnvio: 'S',
        label: 'Retiro en punto de entrega',
        options: [
          {
            carrier: 'Correo Argentino',
            service: 'Correo Argentino Clásico (retiro)',
            costo: Math.round(base * 0.9),
            diasEstimados: zona === 'bahia' ? '48-72hs' : '4-7 días hábiles',
            peso: 1,
            live: false,
          },
          {
            carrier: 'Correo Argentino',
            service: 'Correo Argentino Expreso (retiro)',
            costo: Math.round(base * 1.35),
            diasEstimados: zona === 'bahia' ? '24-48hs' : '2-4 días hábiles',
            peso: 1,
            live: false,
          },
        ],
      },
    ],
  }
}

function mapCorreoRate(rate: any, peso: number, tipoEnvio: string) {
  const productName = rate?.productName || 'Correo Argentino'
  const productType = rate?.productType || ''
  const serviceMap: Record<string, string> = {
    CP: tipoEnvio === 'S' ? 'Correo Argentino Clásico (retiro)' : 'Correo Argentino Clásico',
    EP: tipoEnvio === 'S' ? 'Correo Argentino Expreso (retiro)' : 'Correo Argentino Expreso',
  }

  const isExpreso = productType === 'EP'

  return {
    carrier: 'Correo Argentino',
    service: serviceMap[productType] || productName,
    costo: Math.round(rate?.price || 0),
    diasEstimados: isExpreso
      ? `${rate?.deliveryTimeMin ?? 1}-${rate?.deliveryTimeMax ?? 3} días hábiles`
      : `${rate?.deliveryTimeMin ?? 2}-${rate?.deliveryTimeMax ?? 5} días hábiles`,
    peso,
    productType,
    live: true,
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpKey(request)
    const limit = await rateLimit(`correoargentino:${ip}`, 10, 60000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera 1 minuto.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { cpDestino, peso = 1, largo = 20, ancho = 20, alto = 20 } = body

    if (!cpDestino || cpDestino.length < 4) {
      return NextResponse.json(
        { error: 'Código postal destino requerido (mínimo 4 dígitos)' },
        { status: 400 }
      )
    }

    // Fallback si no hay credenciales
    if (!CA_USER || !CA_PASS || !CA_CUSTOMER_ID) {
      return NextResponse.json(buildFallbackOptions(cpDestino))
    }

    const token = await getToken()
    const dims = { weight: peso, height: alto, width: ancho, length: largo }

    // Cotizar ambas modalidades en paralelo: domicilio (D) y punto de entrega (S)
    const [domicilioRates, sucursalRates] = await Promise.all([
      fetchRates(token, cpDestino, 'D', dims),
      fetchRates(token, cpDestino, 'S', dims),
    ])

    const agencias = await fetchAgencies(token).catch(() => [])

    const modalidades: any[] = []

    if (domicilioRates.length > 0) {
      modalidades.push({
        tipoEnvio: 'D',
        label: 'Entrega a domicilio',
        options: domicilioRates.map((r) => mapCorreoRate(r, peso, 'D')),
      })
    }

    if (sucursalRates.length > 0) {
      modalidades.push({
        tipoEnvio: 'S',
        label: 'Retiro en punto de entrega',
        options: sucursalRates.map((r) => mapCorreoRate(r, peso, 'S')),
      })
    }

    // Si ninguna modalidad devolvió tarifas, usar fallback
    if (modalidades.length === 0) {
      const fb = buildFallbackOptions(cpDestino)
      fb.note = 'Correo Argentino no devolvió tarifas; usando costos estimados.'
      fb.fallback = true
      return NextResponse.json(fb)
    }

    return NextResponse.json({
      success: true,
      live: true,
      modalidades,
      agencias,
    })
  } catch (error) {
    console.error('Correo Argentino envío error:', error)
    const { cpDestino = '1425' } = await request.json().catch(() => ({}))
    const fb = buildFallbackOptions(cpDestino)
    fb.note = 'Error al consultar Correo Argentino; usando costos estimados.'
    fb.fallback = true
    return NextResponse.json(fb)
  }
}
