import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)
  
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
    },
  })

  console.log('Admin user created:', admin.email, '- Role:', admin.role)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
