import 'dotenv/config'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const password = 'admin123'
  const hashedPassword = await bcrypt.hash(password, 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'greatphones.contacto@gmail.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Administrador',
      verified: true
    },
    create: {
      email: 'greatphones.contacto@gmail.com',
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
  
  console.log('Admin actualizado:', admin.email)
  console.log('Password:', password)
  console.log('Verificado:', admin.verified)
  console.log('Role:', admin.role)
  await prisma.$disconnect()
}

main().catch(console.error)
