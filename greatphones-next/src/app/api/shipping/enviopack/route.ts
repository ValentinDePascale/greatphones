import { NextRequest, NextResponse } from 'next/server'

const ENVIOPACK_API_URL = 'https://api.enviopack.com'
const ENVIOPACK_API_KEY = process.env.ENVIOPACK_API_KEY || ''
const ENVIOPACK_SECRET_KEY = process.env.ENVIOPACK_SECRET_KEY || ''

let cachedToken = ''
let tokenExpiresAt = 0

async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const res = await fetch(`${ENVIOPACK_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 'api-key': ENVIOPACK_API_KEY, 'secret-key': ENVIOPACK_SECRET_KEY }),
  })

  if (!res.ok) {
    throw new Error(`Envío Pack auth failed: ${res.status}`)
  }

  const data = await res.json()
  cachedToken = data.access_token || data.token || ''
  tokenExpiresAt = Date.now() + 3 * 60 * 60 * 1000
  return cachedToken
}

function buildFallbackOptions(destZip: string) {
  const zona = destZip.startsWith('8') ? 'bahia' : 'interior'
  const base = zona === 'bahia' ? 3500 : 8500

  return [
    {
      carrier: 'Andreani',
      service: 'Estándar',
      costo: base,
      diasEstimados: zona === 'bahia' ? '24-48hs' : '3-5 días hábiles',
      peso: 1,
    },
    {
      carrier: 'OCA',
      service: 'Prioritario',
      costo: Math.round(base * 1.4),
      diasEstimados: zona === 'bahia' ? '24hs' : '2-3 días hábiles',
      peso: 1,
    },
    {
      carrier: 'Correo Argentino',
      service: 'Común',
      costo: Math.round(base * 0.9),
      diasEstimados: zona === 'bahia' ? '48-72hs' : '5-8 días hábiles',
      peso: 1,
    },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpOrigen = '8000', cpDestino, peso = 1, largo = 20, ancho = 20, alto = 20, valor = 50000 } = body

    if (!cpDestino || cpDestino.length < 4) {
      return NextResponse.json({ error: 'Código postal destino requerido (mínimo 4 dígitos)' }, { status: 400 })
    }

    if (!ENVIOPACK_API_KEY || !ENVIOPACK_SECRET_KEY) {
      const options = buildFallbackOptions(cpDestino)
      return NextResponse.json({ success: true, options, fallback: true })
    }

    const token = await getAuthToken()

    const params = new URLSearchParams({
      cpOrigen,
      cpDestino,
      peso: String(peso),
      largo: String(largo),
      ancho: String(ancho),
      alto: String(alto),
      valor: String(valor),
      access_token: token,
    })

    const res = await fetch(`${ENVIOPACK_API_URL}/cotizar/costo?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      console.error('Envío Pack cotizar error:', res.status)
      const options = buildFallbackOptions(cpDestino)
      return NextResponse.json({ success: true, options, fallback: true, note: 'API error, usando fallback' })
    }

    const data = await res.json()

    const options = (Array.isArray(data) ? data : data.opciones || data.options || []).map((opt: any) => ({
      carrier: opt.correo || opt.carrier || opt.nombre || 'Desconocido',
      service: opt.servicio || opt.service || 'Estándar',
      costo: opt.costo || opt.valor || 0,
      diasEstimados: opt.diasEstimados || opt.plazo || `${opt.dias || 5} días hábiles`,
      peso: opt.peso || peso,
    }))

    if (options.length === 0) {
      const fallbackOptions = buildFallbackOptions(cpDestino)
      return NextResponse.json({ success: true, options: fallbackOptions, fallback: true })
    }

    return NextResponse.json({ success: true, options })
  } catch (error: any) {
    console.error('Envío Pack error:', error)
    const { cpDestino = '1425' } = await request.json().catch(() => ({}))
    const options = buildFallbackOptions(cpDestino)
    return NextResponse.json({ success: true, options, fallback: true, note: 'Error, usando fallback' })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://greatphones.onrender.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
