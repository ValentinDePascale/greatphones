import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 8000 })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// iPhone por modelo (coincide con PriceList CELULAR): slug GSMArena + colores.
const IPHONES = [
  { modelo: 'iPhone 8', slug: 'apple-iphone-8', colors: ['Gold', 'Silver', 'Space Gray'] },
  { modelo: 'iPhone 8 Plus', slug: 'apple-iphone-8-plus', colors: ['Gold', 'Silver', 'Space Gray'] },
  { modelo: 'iPhone X', slug: 'apple-iphone-x', colors: ['Space Gray', 'Silver'] },
  { modelo: 'iPhone XR', slug: 'apple-iphone-xr', colors: ['Black', 'White', 'Blue', 'Coral', 'Yellow', 'Red'] },
  { modelo: 'iPhone XS', slug: 'apple-iphone-xs', colors: ['Gold', 'Silver', 'Space Gray'] },
  { modelo: 'iPhone XS Max', slug: 'apple-iphone-xs-max', colors: ['Gold', 'Silver', 'Space Gray'] },
  { modelo: 'iPhone 11', slug: 'apple-iphone-11', colors: ['Black', 'White', 'Red', 'Yellow', 'Purple', 'Green'] },
  { modelo: 'iPhone 11 Pro', slug: 'apple-iphone-11-pro', colors: ['Space Gray', 'Silver', 'Midnight Green', 'Gold'] },
  { modelo: 'iPhone 11 Pro Max', slug: 'apple-iphone-11-pro-max', colors: ['Space Gray', 'Silver', 'Midnight Green', 'Gold'] },
  { modelo: 'iPhone 12', slug: 'apple-iphone-12', colors: ['Black', 'White', 'Red', 'Green', 'Blue'] },
  { modelo: 'iPhone 12 Mini', slug: 'apple-iphone-12-mini', colors: ['Black', 'White', 'Red', 'Green', 'Blue'] },
  { modelo: 'iPhone 12 Pro', slug: 'apple-iphone-12-pro', colors: ['Silver', 'Graphite', 'Gold', 'Pacific Blue'] },
  { modelo: 'iPhone 12 Pro Max', slug: 'apple-iphone-12-pro-max', colors: ['Silver', 'Graphite', 'Gold', 'Pacific Blue'] },
  { modelo: 'iPhone 13', slug: 'apple-iphone-13', colors: ['Starlight', 'Midnight', 'Blue', 'Pink', 'Red', 'Green'] },
  { modelo: 'iPhone 13 Mini', slug: 'apple-iphone-13-mini', colors: ['Starlight', 'Midnight', 'Blue', 'Pink', 'Red', 'Green'] },
  { modelo: 'iPhone 13 Pro', slug: 'apple-iphone-13-pro', colors: ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'] },
  { modelo: 'iPhone 13 Pro Max', slug: 'apple-iphone-13-pro-max', colors: ['Graphite', 'Gold', 'Silver', 'Sierra Blue', 'Alpine Green'] },
  { modelo: 'iPhone 14', slug: 'apple-iphone-14', colors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red', 'Yellow'] },
  { modelo: 'iPhone 14 Plus', slug: 'apple-iphone-14-plus', colors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red', 'Yellow'] },
  { modelo: 'iPhone 14 Pro', slug: 'apple-iphone-14-pro', colors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'] },
  { modelo: 'iPhone 14 Pro Max', slug: 'apple-iphone-14-pro-max', colors: ['Space Black', 'Silver', 'Gold', 'Deep Purple'] },
  { modelo: 'iPhone 15', slug: 'apple-iphone-15', colors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'] },
  { modelo: 'iPhone 15 Plus', slug: 'apple-iphone-15-plus', colors: ['Black', 'Blue', 'Green', 'Yellow', 'Pink'] },
  { modelo: 'iPhone 15 Pro', slug: 'apple-iphone-15-pro', colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] },
  { modelo: 'iPhone 15 Pro Max', slug: 'apple-iphone-15-pro-max', colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'] },
  { modelo: 'iPhone 16', slug: 'apple-iphone-16', colors: ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'] },
  { modelo: 'iPhone 16 Plus', slug: 'apple-iphone-16-plus', colors: ['Black', 'White', 'Pink', 'Teal', 'Ultramarine'] },
  { modelo: 'iPhone 16 Pro', slug: 'apple-iphone-16-pro', colors: ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'] },
  { modelo: 'iPhone 16 Pro Max', slug: 'apple-iphone-16-pro-max', colors: ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'] },
  { modelo: 'iPhone 17', slug: 'apple-iphone-17', colors: ['Black', 'White', 'Red', 'Teal', 'Purple'] },
  { modelo: 'iPhone 17 Pro', slug: 'apple-iphone-17-pro', colors: ['Black Titanium', 'White Titanium', 'Desert Titanium', 'Indigo Titanium'] },
  { modelo: 'iPhone 17 Pro Max', slug: 'apple-iphone-17-pro-max', colors: ['Black Titanium', 'White Titanium', 'Desert Titanium', 'Indigo Titanium'] },
]

const BASE = 'https://fdn2.gsmarena.com/vv/bigpic'

async function main() {
  let actualizados = 0
  let noEncontrados = 0
  for (const ip of IPHONES) {
    const imageUrl = `${BASE}/${ip.slug}.jpg`
    const res = await prisma.priceList.updateMany({
      where: { category: 'CELULAR', modelo: ip.modelo },
      data: { imageUrl, colors: ip.colors },
    })
    if (res.count > 0) {
      actualizados += res.count
    } else {
      noEncontrados++
      console.log('No existe en PriceList CELULAR:', ip.modelo)
    }
  }
  console.log(`iPhones con imagen/colores originales: ${IPHONES.length}`)
  console.log(`Filas actualizadas: ${actualizados} | modelos sin match: ${noEncontrados}`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })