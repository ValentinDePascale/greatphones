import { prisma } from '@/lib/prisma'
import { requireAdmin, handleRouteError } from '@/lib/auth-guard'
import { apiResponse, apiError } from '@/lib/response'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireAdmin()
    const { orderId } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { orderId },
      include: {
        order: {
          select: {
            id: true,
            code: true,
            status: true,
            total: true,
            subtotal: true,
            warrantyCost: true,
            deliveryCost: true,
            clientName: true,
            clientDni: true,
            clientCuil: true,
            clientEmail: true,
            createdAt: true,
            items: {
              include: {
                product: { select: { name: true, imageUrl: true } },
              },
            },
          },
        },
      },
    })

    if (!invoice) return apiError('La orden no tiene factura', 404)
    return apiResponse(invoice)
  } catch (error) {
    return handleRouteError(error)
  }
}
