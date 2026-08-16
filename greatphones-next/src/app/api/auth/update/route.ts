import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSelfOrAdmin, handleRouteError } from '@/lib/auth-guard'



export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { userId, name, phone, dni, direccion, piso, cp, provincia, ciudad, avatar } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID requerido' }, { status: 400 })
    }

    await requireSelfOrAdmin(userId, request)

    const updateData: any = {}
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (dni !== undefined) updateData.dni = dni
    if (direccion !== undefined) updateData.direccion = direccion
    if (piso !== undefined) updateData.piso = piso
    if (cp !== undefined) updateData.cp = cp
    if (provincia !== undefined) updateData.provincia = provincia
    if (ciudad !== undefined) updateData.ciudad = ciudad
    if (avatar !== undefined) updateData.avatar = avatar

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    return NextResponse.json({ 
      message: 'Usuario actualizado',
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, dni: user.dni, direccion: user.direccion, piso: user.piso, cp: user.cp, provincia: user.provincia, ciudad: user.ciudad, avatar: user.avatar, hasPassword: !!user.password }
    }, { 
      status: 200
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
