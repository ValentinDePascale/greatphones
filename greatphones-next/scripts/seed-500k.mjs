import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import pg from 'pg'
import crypto from 'crypto'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })

const id = crypto.randomUUID()
const code = 'GP-500K-TEST'

pool.query(
  `INSERT INTO "GiftCard" (id, code, "originalAmount", "remainingAmount", status, "buyerEmail", "expiresAt", "purchasedAt")
   VALUES ($1, $2, 500000, 500000, 'ACTIVE', 'admin@greatphones.com', NOW() + INTERVAL '1 year', NOW())
   ON CONFLICT (code) DO NOTHING RETURNING code`,
  [id, code]
).then(r => {
  if (r.rows.length) console.log('GiftCard creada: ' + r.rows[0].code + ' - $500,000')
  else console.log('Ya existe: ' + code)
  pool.end()
}).catch(e => { console.log('ERR:', e.message); pool.end() })
