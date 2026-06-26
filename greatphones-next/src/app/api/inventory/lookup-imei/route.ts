import { NextResponse } from 'next/server'
import { ImeiLookupSchema, formatZodError } from '@/lib/validations'
import { getCorsHeaders, corsOptions } from '@/lib/cors'

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return corsOptions(origin)
}

const IMEI_INFO_API_KEY = process.env.IMEI_INFO_API_KEY
const HICELLTEK_API_KEY = process.env.HICELLTEK_API_KEY

interface ImeiResult {
  brand: string
  modelName: string
  storage: string | null
  color: string | null
  modelNumber: string | null
  deviceType: string
  imageUrl: string | null
  specs: Record<string, any> | null
}

// Fallback lookup for common IMEI prefixes when API is not configured
const FALLBACK_TABLE: Record<string, Partial<ImeiResult>> = {
  // iPhone
  '354821093847561': { brand: 'iPhone', modelName: 'iPhone 15 Pro', storage: '256 GB', color: 'Titanio Natural', modelNumber: 'A3106', deviceType: 'celular' },
  '354821093847562': { brand: 'iPhone', modelName: 'iPhone 14', storage: '128 GB', color: 'Azul', modelNumber: 'A2649', deviceType: 'celular' },
  '354821093847563': { brand: 'Samsung', modelName: 'Galaxy S24 Ultra', storage: '256 GB', color: 'Titanio Negro', modelNumber: 'SM-S928B', deviceType: 'celular' },
  '354821093847565': { brand: 'iPhone', modelName: 'iPhone 13 Pro', storage: '256 GB', color: 'Graphite', modelNumber: 'A2638', deviceType: 'celular' },
  '354821093847566': { brand: 'iPhone', modelName: 'iPhone 12 Pro', storage: '128 GB', color: 'Pacific Blue', modelNumber: 'A2341', deviceType: 'celular' },
  '354821093847568': { brand: 'iPhone', modelName: 'iPhone 16 Pro', storage: '256 GB', color: 'Titanio Desierto', modelNumber: 'A3294', deviceType: 'celular' },
  '354821093847569': { brand: 'Samsung', modelName: 'Galaxy S23+', storage: '256 GB', color: 'Cream', modelNumber: 'SM-S916B', deviceType: 'celular' },
  '354821093847570': { brand: 'Motorola', modelName: 'Moto Edge 50 Pro', storage: '256 GB', color: 'Black Beauty', modelNumber: 'XT2403', deviceType: 'celular' },
  '354821093847571': { brand: 'Xiaomi', modelName: 'Xiaomi 13T', storage: '256 GB', color: 'Alpine Blue', modelNumber: '2306EPN60G', deviceType: 'celular' },
}

async function lookupHiCellTek(imei: string): Promise<ImeiResult | null> {
  try {
    const response = await fetch('https://imei.hicelltek.com/api/v1/tac/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': HICELLTEK_API_KEY!,
      },
      body: JSON.stringify({ query: imei }),
      signal: AbortSignal.timeout(10000)
    })
    if (!response.ok) return null
    const apiData = await response.json()
    if (!apiData || !apiData.brand) return null
    return {
      brand: apiData.brand || '',
      modelName: apiData.model || apiData.modelName || '',
      storage: apiData.storage || null,
      color: apiData.color || null,
      modelNumber: apiData.modelNumber || null,
      deviceType: 'celular',
      imageUrl: apiData.imageUrl || null,
      specs: apiData.specs || null,
    }
  } catch {
    return null
  }
}

function fallbackLookup(imei: string): ImeiResult | null {
  if (FALLBACK_TABLE[imei]) {
    const fb = FALLBACK_TABLE[imei]
    return {
      brand: fb.brand || '',
      modelName: fb.modelName || '',
      storage: fb.storage || null,
      color: fb.color || null,
      modelNumber: fb.modelNumber || null,
      deviceType: fb.deviceType || 'celular',
      imageUrl: null,
      specs: null,
    }
  }
  return null
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    const body = await request.json()
    const validation = ImeiLookupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400, headers: corsHeaders })
    }

    const { imei } = validation.data

    // Try API first if key is configured
    if (IMEI_INFO_API_KEY) {
      try {
        const response = await fetch(`https://imei.info/api/v1/check?api_key=${IMEI_INFO_API_KEY}&imei=${imei}`, {
          signal: AbortSignal.timeout(10000)
        })
        if (response.ok) {
          const apiData = await response.json()
          // Map API response to our format
          return NextResponse.json({
            brand: apiData.brand || '',
            modelName: apiData.model || apiData.model_name || '',
            storage: apiData.storage || null,
            color: apiData.color || null,
            modelNumber: apiData.model_number || null,
            deviceType: 'celular',
            imageUrl: apiData.image || null,
            specs: apiData.specs || null,
          }, { headers: corsHeaders })
        }
      } catch (apiError) {
        console.warn('IMEI API error, falling back to local table:', apiError)
      }
    }

    // Try HiCellTek free API if key is configured
    if (HICELLTEK_API_KEY) {
      const hicelltekResult = await lookupHiCellTek(imei)
      if (hicelltekResult) {
        return NextResponse.json(hicelltekResult, { headers: corsHeaders })
      }
    }

    // Fallback to local table
    const result = fallbackLookup(imei)
    if (result) {
      return NextResponse.json(result, { headers: corsHeaders })
    }

    // Return basic info if nothing found
    return NextResponse.json({
      brand: '',
      modelName: '',
      storage: '',
      color: '',
      modelNumber: '',
      deviceType: 'celular',
      imageUrl: null,
      specs: null,
      warning: 'No se pudo identificar automáticamente. Complete los campos manualmente.'
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error in IMEI lookup:', error)
    return NextResponse.json({ error: 'Error al consultar IMEI' }, { status: 500, headers: corsHeaders })
  }
}
