import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
pool.query('SELECT id, email, name, role FROM "User" LIMIT 10')
  .then(r => {
    if (r.rows.length === 0) {
      console.log('No users found')
    } else {
      r.rows.forEach(u => console.log(u.id.substring(0,8)+'...', u.email, u.name, u.role))
    }
    pool.end()
  })
  .catch(e => { console.log('ERR:', e.message); pool.end() })
