import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()
const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
try {
  await pool.query(`ALTER TYPE "GiftCardStatus" ADD VALUE IF NOT EXISTS 'PENDING'`)
  console.log('OK: PENDING added to GiftCardStatus')
} catch (e) {
  console.log('Info:', e.message)
}
await pool.end()
