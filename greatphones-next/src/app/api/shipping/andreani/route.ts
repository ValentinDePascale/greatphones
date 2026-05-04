import { NextRequest, NextResponse } from 'next/server'

// Andreani API Configuration
const ANDREANI_API_URL = process.env.ANDREANI_API_URL || 'https://api.andreani.com'
const ANDREANI_CONTRATO = process.env.ANDREANI_CONTRATO || ''
const ANDREANI_CUIT = process.env.ANDREANI_CUIT || ''

// Zona codes for Andreani (simplified mapping)
const ZONA_CODES: Record<string, number> = {
  'CABA': 1,
  'Buenos Aires': 2,
  'Córdoba': 3,
  'Santa Fe': 4,
  'Mendoza': 5,
  'Tucumán': 6,
  'Entre Ríos': 7,
  'Salta': 8,
  'Neuquén': 9,
  'Río Negro': 10,
  'Chubut': 11,
  'Santa Cruz': 12,
  'Tierra del Fuego': 13,
  'San Juan': 14,
  'San Luis': 15,
  'La Rioja': 16,
  'Catamarca': 17,
  'Santiago del Estero': 18,
  'Formosa': 19,
  'Corrientes': 20,
  'Misiones': 21,
  'La Pampa': 22,
  'Jujuy': 23,
  'Chaco': 24,
}

// Base shipping costs by zone (from Bahía Blanca)
const BASE_COSTS: Record<number, number> = {
  1: 8500,   // CABA
  2: 6500,   // Buenos Aires (GBA)
  3: 9500,   // Córdoba
  4: 8000,   // Santa Fe
  5: 10500,  // Mendoza
  6: 11000,  // Tucumán
  7: 7500,   // Entre Ríos
  8: 12000,  // Salta
  9: 11500,  // Neuquén
  10: 12500, // Río Negro
  11: 14000, // Chubut
  12: 16000, // Santa Cruz
  13: 18000, // Tierra del Fuego
  14: 10000, // San Juan
  15: 9000,  // San Luis
  16: 10500, // La Rioja
  17: 11000, // Catamarca
  18: 10000, // Santiago del Estero
  19: 12000, // Formosa
  20: 11500, // Corrientes
  21: 13000, // Misiones
  22: 7000,  // La Pampa
  23: 12500, // Jujuy
  24: 11000, // Chaco
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destProvince, destZip, weight = 1 } = body

    if (!destProvince) {
      return NextResponse.json(
        { error: 'Provincia destino requerida' },
        { status: 400 }
      )
    }

    // If Andreani API credentials are configured, use real API
    if (ANDREANI_CONTRATO && ANDREANI_CUIT) {
      return await calculateWithAndreaniAPI(body)
    }

    // Fallback: use estimated costs based on zone
    const zonaCode = ZONA_CODES[destProvince] || 2
    const baseCost = BASE_COSTS[zonaCode] || 10000
    
    // Adjust for weight (each kg adds ~15%)
    const weightMultiplier = 1 + (weight - 1) * 0.15
    const finalCost = Math.round(baseCost * weightMultiplier)

    return NextResponse.json({
      success: true,
      cost: finalCost,
      carrier: 'Andreani',
      estimatedDays: zonaCode <= 4 ? '24-48hs' : '48-72hs',
      zone: zonaCode,
      note: 'Costo estimado. Configure ANDREANI_CONTRATO y ANDREANI_CUIT para precios reales.'
    })

  } catch (error: any) {
    console.error('Andreani shipping error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al calcular envío' },
      { status: 500 }
    )
  }
}

async function calculateWithAndreaniAPI(body: any) {
  // Real Andreani API integration
  // Documentation: https://api.andreani.com/
  
  const authToken = Buffer.from(`${ANDREANI_CONTRATO}:${ANDREANI_CUIT}`).toString('base64')
  
  const response = await fetch(`${ANDREANI_API_URL}/v1/envios/cotizacion`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origen: {
        codigoPostal: body.originZip || '8000',
        localidad: body.originCity || 'Bahía Blanca',
        provincia: body.originProvince || 'Buenos Aires',
      },
      destino: {
        codigoPostal: body.destZip || '',
        localidad: body.destCity || '',
        provincia: body.destProvince,
      },
      bultos: [
        {
          peso: body.weight || 1,
          alto: 20,
          ancho: 20,
          largo: 20,
        }
      ],
      valorDeclarado: 0,
    }),
  })

  if (!response.ok) {
    throw new Error(`Andreani API error: ${response.status}`)
  }

  const data = await response.json()
  
  // Parse Andreani response
  const costo = data.costoTotal || data.valor || 0
  
  return NextResponse.json({
    success: true,
    cost: Math.round(costo),
    carrier: 'Andreani',
    estimatedDays: data.diasEstimadosEntrega || '48-72hs',
    serviceType: data.tipoServicio || 'Estándar',
  })
}
