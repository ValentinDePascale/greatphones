import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  // Get or create a test user
  let user = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  })
  
  if (!user) {
    const hashedPassword = 'test1234'
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test Usuario',
        password: hashedPassword,
        phone: '2915123456',
        dni: '12345678',
        provincia: 'Buenos Aires',
        ciudad: 'Bahia Blanca',
        role: 'CLIENT',
        verified: true
      }
    })
    console.log('Created user:', user.email)
  }

  // Create an order
  const order = await prisma.order.create({
    data: {
      code: 'GP-2026-0001',
      userId: user.id,
      status: 'DELIVERED',
      warranty: '6 meses',
      cuotas: 1,
      subtotal: 890000,
      total: 890000
    }
  })
  console.log('Created order:', order.code, 'ID:', order.id)

  // Create an arrepentimiento record
  const arrep = await prisma.arrepentimiento.create({
    data: {
      orderId: order.id,
      userId: user.id,
      email: user.email,
      telefono: '2915123456',
      motivo: 'Me arrepentí de la compra porque encontré mejor precio en otro local',
      estado: 'PENDIENTE'
    }
  })
  console.log('Created arrepentimiento:', arrep.id, 'Estado:', arrep.estado)
  
  await prisma.$disconnect()
  console.log('\n=== DATOS PARA TESTEAR ===')
  console.log('Order Code:', order.code)
  console.log('Arrepentimiento ID:', arrep.id)
  console.log('User email:', user.email)
}

main().catch(console.error)