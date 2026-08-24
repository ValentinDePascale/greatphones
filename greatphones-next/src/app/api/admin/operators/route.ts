import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'
import { z } from 'zod'

const DEFAULT_OPERATORS = ['Martin', 'Maca', 'Sam', 'Eva', 'Buda']

const OperatorSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  active: z.boolean().optional().default(true),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    let ops = await prisma.operator.findMany({ orderBy: { name: 'asc' } })
    // Seeder: si no hay operadores, crea los del ERP
    if (ops.length === 0) {
      await prisma.operator.createMany({
        data: DEFAULT_OPERATORS.map((n) => ({ name: n })),
        skipDuplicates: true,
      })
      ops = await prisma.operator.findMany({ orderBy: { name: 'asc' } })
    }
    return NextResponse.json(ops)
  } catch (error) {
    console.error('[Admin Operators GET]', error)
    return NextResponse.json({ error: 'Error al obtener operadores' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const body = await request.json()
    const parsed = OperatorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    }
    const op = await prisma.operator.upsert({
      where: { name: parsed.data.name },
      update: { active: parsed.data.active },
      create: { name: parsed.data.name, active: parsed.data.active },
    })
    return NextResponse.json(op, { status: 201 })
  } catch (error) {
    console.error('[Admin Operators POST]', error)
    return NextResponse.json({ error: 'Error al crear operador' }, { status: 500 })
  }
}