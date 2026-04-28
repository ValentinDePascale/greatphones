import 'dotenv/config'
import { prisma } from '../lib/prisma'

const accessories = [
  { name: 'Cargador 20W USB-C', ico: '🔌', category: 'Cargadores', price: 25000, compareAtPrice: 35000, stock: 25, brand: 'Apple', color: 'Blanco', compatibleModels: 'iPhone,iPad' },
  { name: 'Cable USB-C a Lightning 1m', ico: '🔗', category: 'Cables', price: 18000, compareAtPrice: 25000, stock: 40, brand: 'Apple', color: 'Blanco', compatibleModels: 'iPhone,iPad' },
  { name: 'Cable USB-C 1m', ico: '🔗', category: 'Cables', price: 15000, compareAtPrice: null, stock: 30, brand: 'Apple', color: 'Blanco', compatibleModels: 'iPhone,Android' },
  { name: 'AirPods Pro 2da gen', ico: '🎧', category: 'Auriculares', price: 295000, compareAtPrice: 349000, stock: 15, brand: 'Apple', color: 'Blanco', compatibleModels: 'iPhone,iPad,Mac' },
  { name: 'AirPods 4', ico: '🎧', category: 'Auriculares', price: 165000, compareAtPrice: 199000, stock: 20, brand: 'Apple', color: 'Blanco', compatibleModels: 'iPhone,iPad,Mac' },
  { name: 'AirPods Max', ico: '🎧', category: 'Auriculares', price: 595000, compareAtPrice: 749000, stock: 8, brand: 'Apple', color: 'Plata', compatibleModels: 'iPhone,iPad,Mac' },
  { name: 'MagSafe Charger', ico: '🧲', category: 'Cargadores', price: 45000, compareAtPrice: 55000, stock: 12, brand: 'Apple', color: 'Blanco', compatibleModels: 'iPhone 12,iPhone 13,iPhone 14,iPhone 15,iPhone 16' },
  { name: 'MagSafe Battery Pack', ico: '🔋', category: 'Cargadores', price: 135000, compareAtPrice: 169000, stock: 6, brand: 'Apple', color: 'Blanco', compatibleModels: 'iPhone 12,iPhone 13,iPhone 14,iPhone 15,iPhone 16' },
  { name: 'Apple Watch Nike Sport Band', ico: '⏱', category: 'Bandas', price: 55000, compareAtPrice: null, stock: 18, brand: 'Apple', color: 'Negro', compatibleModels: 'Apple Watch 38-45mm' },
  { name: 'Apple Watch Leather Band', ico: '⏱', category: 'Bandas', price: 95000, compareAtPrice: 125000, stock: 10, brand: 'Apple', color: 'Marron', compatibleModels: 'Apple Watch 38-45mm' },
  { name: 'Estuche AirPods Pro', ico: '🎧', category: 'Fundas', price: 35000, compareAtPrice: 45000, stock: 22, brand: 'Apple', color: 'Transparente', compatibleModels: 'AirPods Pro 2da gen' },
  { name: 'Estuche AirPods', ico: '🎧', category: 'Fundas', price: 25000, compareAtPrice: null, stock: 28, brand: 'Apple', color: 'Transparente', compatibleModels: 'AirPods 3ra gen' },
  { name: 'Samsung Buds3 Pro', ico: '🎧', category: 'Auriculares', price: 245000, compareAtPrice: 299000, stock: 12, brand: 'Samsung', color: 'Negro', compatibleModels: 'Samsung,iPhone,Android' },
  { name: 'Samsung 45W charger', ico: '🔌', category: 'Cargadores', price: 38000, compareAtPrice: 45000, stock: 15, brand: 'Samsung', color: 'Negro', compatibleModels: 'Samsung,Android' },
  { name: 'Anker 737 Power Bank', ico: '🔋', category: 'Cargadores', price: 145000, compareAtPrice: 179000, stock: 8, brand: 'Anker', color: 'Negro', compatibleModels: 'iPhone,Android' },
  { name: 'Spigen Crystal Case iPhone 16', ico: '📱', category: 'Fundas', price: 22000, compareAtPrice: null, stock: 35, brand: 'Spigen', color: 'Transparente', compatibleModels: 'iPhone 16' },
  { name: 'Spigen Ultra Hybrid iPhone 16 Pro', ico: '📱', category: 'Fundas', price: 18000, compareAtPrice: 25000, stock: 40, brand: 'Spigen', color: 'Negro', compatibleModels: 'iPhone 16 Pro' },
  { name: 'Otterbox Defender iPhone 16', ico: '📱', category: 'Fundas', price: 65000, compareAtPrice: 85000, stock: 10, brand: 'Otterbox', color: 'Negro', compatibleModels: 'iPhone 16' },
]

async function main() {
  for (const a of accessories) {
    const created = await prisma.accessory.create({
      data: a
    })
    console.log('Created:', created.name)
  }
  console.log('All accessories created!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())