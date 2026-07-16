import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import { requireAdmin } from '@/lib/auth-guard'

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return corsOptions(origin)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const { id } = await params
    const history = await prisma.inventoryHistory.findMany({
      where: { inventoryItemId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(history, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500, headers: corsHeaders })
  }
}
