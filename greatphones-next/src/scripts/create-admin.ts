import 'dotenv/config'
import { randomBytes } from 'crypto'
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const password = randomBytes(16).toString('base64url')
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
  console.log('Role:', admin.role)
  console.log('Verificado:', admin.verified)
  await prisma.$disconnect()

  console.error('\n=== ADMIN PASSWORD (guardar en gestor seguro, NO en el repo) ===')
  console.error(password)
  console.error('====================================================================\n')
}

main().catch(console.error)
