import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 8000 })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// [key, multiplicador, horas, activo]
const CONFIG = [
  ['bateria', 1.5, 24, true],
  ['pantalla', 1.0, 48, true],
  ['camara', 1.0, 48, true],
  ['microfono', 1.0, 24, true],
  ['parlante', 1.0, 24, true],
  ['tapa', 1.0, 24, true],
  ['marco', 1.0, 48, true],
  ['pin', 1.0, 24, true],
  ['flex', 1.0, 24, false],
  ['botones', 1.0, 24, false],
  ['chasis', 1.0, 48, false],
]

async function main() {
  const count = await prisma.repairConfig.count()
  if (count === 0) {
    for (const [key, multiplicador, horas, activo] of CONFIG) {
      await prisma.repairConfig.upsert({
        where: { key: key },
        update: {},
        create: { key, multiplicador, horas, activo },
      })
    }
    console.log(`Seeded ${CONFIG.length} configs de reparación`)
  } else {
    console.log('RepairConfig ya tiene datos, se saltea')
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
