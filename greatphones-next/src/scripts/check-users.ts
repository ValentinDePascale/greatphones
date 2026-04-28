import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const users = await prisma.user.findMany()
  console.log('Total users:', users.length)
  if (users.length > 0) {
    console.log('Users:', JSON.stringify(users, null, 2))
  } else {
    console.log('No users')
  }
  await prisma.$disconnect()
}

main().catch(console.error)