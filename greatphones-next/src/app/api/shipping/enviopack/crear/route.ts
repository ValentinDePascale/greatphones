import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth-guard'

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
  if (!res.ok) throw new Error(`Envío Pack auth failed: ${res.status}`)
  const data = await res.json()
  cachedToken = data.access_token || data.token || ''
  tokenExpiresAt = Date.now() + 3 * 60 * 60 * 1000
  return cachedToken
}

export async function POST(request: NextRequest) {
  try {
    await requireSession(request)
    const body = await request.json()
    const { orderCode, carrier, service, destino } = body

    if (!orderCode || !carrier || !destino) {
      return NextResponse.json({ error: 'orderCode, carrier y destino requeridos' }, { status: 400 })
    }

    if (!ENVIOPACK_API_KEY || !ENVIOPACK_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'API de Envío Pack no configurada. Configure ENVIOPACK_API_KEY y ENVIOPACK_SECRET_KEY para crear envíos reales.',
      }, { status: 501 })
    }

    const token = await getAuthToken()

    const pedidoRes = await fetch(`${ENVIOPACK_API_URL}/pedidos?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ExternalId: orderCode,
        Destino: {
          Nombre: destino.nombre || 'Cliente',
          Email: destino.email || '',
          Telefono: destino.telefono || '',
          Dni: destino.dni || '',
          Domicilio: destino.domicilio || '',
          CodigoPostal: destino.cp || '',
          Localidad: destino.localidad || '',
          Provincia: destino.provincia || '',
          Pais: 'AR',
        },
        Observaciones: `Pedido Great Phones #${orderCode}`,
      }),
    })

    if (!pedidoRes.ok) {
      const err = await pedidoRes.text()
      console.error('Envío Pack pedido error:', err)
      return NextResponse.json({ error: `Error creando pedido: ${pedidoRes.status}` }, { status: 500 })
    }

    const pedidoData = await pedidoRes.json()
    const pedidoId = pedidoData.id || pedidoData.pedidoId

    const envioRes = await fetch(`${ENVIOPACK_API_URL}/envios?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        PedidoId: pedidoId,
        Correo: carrier,
        Servicio: service || 'Estándar',
        Peso: 1,
        Largo: 20,
        Ancho: 20,
        Alto: 20,
        Valor: 50000,
        Origen: {
          Nombre: 'Great Phones',
          Domicilio: 'Zelarrayan 179',
          CodigoPostal: '8000',
          Localidad: 'Bahía Blanca',
          Provincia: 'Buenos Aires',
          Telefono: '2911234567',
        },
        Destino: {
          Nombre: destino.nombre || 'Cliente',
          Domicilio: destino.domicilio || '',
          CodigoPostal: destino.cp || '',
          Localidad: destino.localidad || '',
          Provincia: destino.provincia || '',
          Telefono: destino.telefono || '',
        },
      }),
    })

    if (!envioRes.ok) {
      const err = await envioRes.text()
      console.error('Envío Pack envio error:', err)
      return NextResponse.json({ error: `Error creando envío: ${envioRes.status}` }, { status: 500 })
    }

    const envioData = await envioRes.json()
    const trackingNumber = envioData.trackingNumber || envioData.codigo || envioData.id
    const enviopackId = envioData.id

    return NextResponse.json({
      success: true,
      trackingNumber,
      enviopackId,
      carrier,
      service,
    })
  } catch (error: any) {
    console.error('Envío Pack crear error:', error)
    return NextResponse.json({ error: 'Error al crear envío' }, { status: 500 })
  }
}


