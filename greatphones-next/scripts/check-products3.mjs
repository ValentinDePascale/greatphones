import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
pool.query('SELECT id, name, price, stock FROM "Product" WHERE stock > 0 OR stock IS NULL LIMIT 5')
  .then(r => {
    if (r.rows.length === 0) console.log('No products')
    else r.rows.forEach(p => console.log(p.id, p.name, '$'+p.price, 'stock:', p.stock))
    pool.end()
  })
  .catch(e => { console.log('ERR:', e.message); pool.end() })
