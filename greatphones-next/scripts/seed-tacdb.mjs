import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

import { config } from 'dotenv'
config({ path: path.resolve(__dirname, '../.env.local') })
config({ path: path.resolve(__dirname, '../.env') })

const dbPath = path.resolve(__dirname, '../../tmp/tacdb.json')
const tacdb = require(dbPath)

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const entries = []

for (const [brand, brandData] of Object.entries(tacdb.brands)) {
  for (const modelEntry of brandData.models) {
    const modelName = Object.keys(modelEntry)[0]
    const tacs = modelEntry[modelName].tacs || []
    for (const tac of tacs) {
      entries.push({ tac, brand, modelName, deviceType: 'celular' })
    }
  }
}

console.log(`Collected ${entries.length} TAC entries to import`)
const BATCH = 500
for (let i = 0; i < entries.length; i += BATCH) {
  const batch = entries.slice(i, i + BATCH)
  await prisma.tacCache.createMany({
    data: batch,
    skipDuplicates: true,
  })
  console.log(`Inserted ${Math.min(i + BATCH, entries.length)}/${entries.length}`)
}

console.log('Done!')
await prisma.$disconnect()
