import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCorsHeaders, corsOptions } from '@/lib/cors'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-guard'

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return corsOptions(origin)
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.supplier.count({ where })
    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      data: suppliers,
      page, limit, total,
      totalPages: Math.ceil(total / limit),
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500, headers: corsHeaders })
  }
}

const SupplierCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.string().optional().default('local'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  try {
    await requireAdmin(request)
    const body = await request.json()
    const validation = SupplierCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: validation.error.issues }, { status: 400, headers: corsHeaders })
    }

    const supplier = await prisma.supplier.create({
      data: validation.data,
    })

    return NextResponse.json(supplier, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500, headers: corsHeaders })
  }
}
