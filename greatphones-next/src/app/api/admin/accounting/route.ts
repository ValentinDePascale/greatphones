import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { registerEntry, getCashBalances, listEntries } from '@/lib/accounting'
import { z } from 'zod'

const ManualEntrySchema = z.object({
  source: z.string().default('MANUAL'),
  description: z.string().min(1, 'Descripción requerida'),
  category: z.string().optional(),
  type: z.enum(['INGRESO', 'EGRESO', 'NEUTRO']),
  means: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CUOTAS', 'USD', 'PAGO_ONLINE']),
  amount: z.number().int(),
  amountUsd: z.number().optional(),
  operator: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const means = searchParams.get('means') as any
    const type = searchParams.get('type') as any
    const search = searchParams.get('search')
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 40)

    const [balances, entries] = await Promise.all([
      getCashBalances(),
      listEntries({ page, limit, means, type, search }),
    ])

    return NextResponse.json({ balances, ...entries })
  } catch (error) {
    console.error('[Admin Accounting GET]', error)
    return NextResponse.json({ error: 'Error al obtener la contabilidad' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const parsed = ManualEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }
    const d = parsed.data
    if (d.type !== 'NEUTRO' && (!d.amount || d.amount <= 0)) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
    }
    if (d.means === 'USD' && !d.amountUsd) {
      return NextResponse.json({ error: 'Para caja USD indicá la cantidad de dólares' }, { status: 400 })
    }

    // Genera N° de operación manual GST/CAM/AJC
    const prefix = d.source === 'GASTO' ? 'GST' : d.source === 'CAMBIO' ? 'CAM' : d.source === 'AJUSTE' ? 'AJC' : 'OP'
    const last = await prisma.accountingEntry.count({ where: { source: d.source } })
    const opNumber = `${prefix}-${String(100 + last).slice(1)}`

    const entry = await registerEntry({
      source: d.source,
      operationId: opNumber,
      description: d.description,
      category: d.category || undefined,
      type: d.type,
      means: d.means,
      amount: d.amount,
      amountUsd: d.means === 'USD' ? d.amountUsd : null,
      operator: d.operator || undefined,
    })

    return NextResponse.json({ entry, opNumber }, { status: 201 })
  } catch (error) {
    console.error('[Admin Accounting POST]', error)
    return NextResponse.json({ error: 'Error al registrar el movimiento' }, { status: 500 })
  }
}