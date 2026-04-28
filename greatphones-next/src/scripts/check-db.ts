import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const products = await prisma.product.findMany()
  console.log('Total products:', products.length)
  if (products.length > 0) {
    console.log('First product:', JSON.stringify(products[0], null, 2))
  }
  await prisma.$disconnect()
}

main().catch(console.error)