import 'dotenv/config'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const hashedPassword = await bcrypt.hash('1234', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@greatphones.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Administrador',
    },
    create: {
      email: 'admin@greatphones.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '2915123456',
      dni: '12345678',
      provincia: 'Buenos Aires',
      ciudad: 'Bahia Blanca',
      verified: true
    },
  })
  
  console.log('Admin created:', admin.email, '- Role:', admin.role)
  await prisma.$disconnect()
}

main().catch(console.error)