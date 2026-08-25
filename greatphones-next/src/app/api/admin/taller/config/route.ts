import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { z } from 'zod'

const ConfigSchema = z.object({
  key: z.string().min(1),
  multiplicador: z.number().positive().default(1),
  horas: z.number().int().min(1).default(48),
  activo: z.boolean().default(true),
})

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const rows = await prisma.repairConfig.findMany({ orderBy: { key: 'asc' } })
    return NextResponse.json(rows)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request)
    const body = await request.json()
    const parsed = ConfigSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 })
    const d = parsed.data
    const row = await prisma.repairConfig.upsert({
      where: { key: d.key },
      update: { ...d, updatedBy: admin.id },
      create: { ...d, updatedBy: admin.id },
    })
    return NextResponse.json(row)
  } catch (error) {
    return handleRouteError(error)
  }
}
