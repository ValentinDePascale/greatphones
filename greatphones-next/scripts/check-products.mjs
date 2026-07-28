import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
pool.query('SELECT id, name, "finalPrice", stock FROM "Product" WHERE stock > 0 LIMIT 5')
  .then(r => {
    if (r.rows.length === 0) console.log('No products with stock')
    else r.rows.forEach(p => console.log(p.id.substring(0,12)+'...', p.name, '$'+p.finalPrice, 'stock:', p.stock))
    pool.end()
  })
  .catch(e => { console.log('ERR:', e.message); pool.end() })
