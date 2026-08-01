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

function fallbackLookup(_imei: string): Partial<ImeiResult> | null {
  // No hardcoded test IMEIs — production should rely on TAC database
  return null
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
