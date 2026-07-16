import { NextResponse } from 'next/server'
import { ImeiLookupSchema, formatZodError } from '@/lib/validations'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth-guard'

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return corsOptions(origin)
}

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

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const body = await request.json()
    const validation = ImeiLookupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), { status: 400, headers: corsHeaders })
    }

    const { imei } = validation.data
    const tac = extractTac(imei)

    // 1. Check TAC cache (22,527 pre-seeded TACs from Osmocom DB)
    const cached = await prisma.tacCache.findUnique({ where: { tac } })
    if (cached) {
      prisma.tacCache.update({
        where: { tac },
        data: { hitCount: { increment: 1 } }
      }).catch(() => {})
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

    // 2. Fallback to local table (testing IMEIs)
    const fallback = fallbackLookup(imei)
    if (fallback) {
      return NextResponse.json(fallback, { headers: corsHeaders })
    }

    // 3. Nothing found — return error so frontend shows manual form
    return NextResponse.json({
      error: 'No se pudo identificar el IMEI. Complete los campos manualmente.'
    }, { status: 404, headers: corsHeaders })
  } catch (error) {
    console.error('Error in IMEI lookup:', error)
    return NextResponse.json({ error: 'Error al consultar IMEI' }, { status: 500, headers: corsHeaders })
  }
}
