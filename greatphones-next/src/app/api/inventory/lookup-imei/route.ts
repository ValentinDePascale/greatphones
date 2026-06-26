import { NextResponse } from 'next/server'
import { ImeiLookupSchema, formatZodError } from '@/lib/validations'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

function extractTac(imei: string): string {
  return imei.substring(0, 8)
}

function fallbackLookup(imei: string): Partial<ImeiResult> | null {
  const table: Record<string, Partial<ImeiResult>> = {
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
  const fb = table[imei]
  if (!fb) return null
  return { ...fb, imageUrl: null, specs: null }
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
    const d = await response.json()
    if (!d || !d.brand) return null
    return {
      brand: d.brand || '',
      modelName: d.model || d.modelName || '',
      storage: d.storage || null,
      color: d.color || null,
      modelNumber: d.modelNumber || null,
      deviceType: 'celular',
      imageUrl: d.imageUrl || null,
      specs: d.specs || null,
    }
  } catch {
    return null
  }
}

async function lookupImeiInfo(imei: string): Promise<ImeiResult | null> {
  try {
    const response = await fetch(`https://imei.info/api/v1/check?api_key=${IMEI_INFO_API_KEY}&imei=${imei}`, {
      signal: AbortSignal.timeout(10000)
    })
    if (!response.ok) return null
    const d = await response.json()
    return {
      brand: d.brand || '',
      modelName: d.model || d.model_name || '',
      storage: d.storage || null,
      color: d.color || null,
      modelNumber: d.model_number || null,
      deviceType: 'celular',
      imageUrl: d.image || null,
      specs: d.specs || null,
    }
  } catch {
    return null
  }
}

async function saveToCache(tac: string, result: ImeiResult) {
  try {
    await prisma.tacCache.upsert({
      where: { tac },
      update: { hitCount: { increment: 1 } },
      create: {
        tac,
        brand: result.brand,
        modelName: result.modelName,
        storage: result.storage,
        color: result.color,
        modelNumber: result.modelNumber,
        deviceType: result.deviceType,
        imageUrl: result.imageUrl,
        specs: result.specs ?? Prisma.DbNull,
      }
    })
  } catch {
    // non-critical
  }
}

async function hitCache(tac: string) {
  try {
    await prisma.tacCache.update({
      where: { tac },
      data: { hitCount: { increment: 1 } }
    })
  } catch {
    // non-critical
  }
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
    const tac = extractTac(imei)

    // 1. Check TAC cache
    const cached = await prisma.tacCache.findUnique({ where: { tac } })
    if (cached) {
      hitCache(tac)
      return NextResponse.json({
        brand: cached.brand,
        modelName: cached.modelName,
        storage: cached.storage,
        color: cached.color,
        modelNumber: cached.modelNumber,
        deviceType: cached.deviceType,
        imageUrl: cached.imageUrl,
        specs: cached.specs,
      }, { headers: corsHeaders })
    }

    // 2. Try external APIs
    let apiResult: ImeiResult | null = null
    if (IMEI_INFO_API_KEY) {
      apiResult = await lookupImeiInfo(imei)
    }
    if (!apiResult && HICELLTEK_API_KEY) {
      apiResult = await lookupHiCellTek(imei)
    }
    if (apiResult) {
      saveToCache(tac, apiResult)
      return NextResponse.json(apiResult, { headers: corsHeaders })
    }

    // 3. Fallback to local table
    const fallback = fallbackLookup(imei)
    if (fallback) {
      return NextResponse.json(fallback, { headers: corsHeaders })
    }

    // 4. Nothing found
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
