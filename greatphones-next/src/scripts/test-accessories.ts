import { prisma } from '../lib/prisma'

async function test() {
  const accs = await prisma.accessory.findMany()
  console.log('Accessories:', accs.length)
  console.log(accs)
}

test()
  .catch(console.error)
  .finally(() => { prisma.$disconnect() })