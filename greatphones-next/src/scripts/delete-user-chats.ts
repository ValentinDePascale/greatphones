import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: { contains: 'Valentin De Pascale', mode: 'insensitive' } },
    include: { conversations: true }
  })

  if (!user) {
    console.log('Usuario "Valentin De Pascale" no encontrado')
    await prisma.$disconnect()
    return
  }

  console.log('Usuario encontrado:', user.email)
  console.log('Conversaciones:', user.conversations.length)

  for (const conv of user.conversations) {
    console.log('Eliminando conversacion:', conv.id)
    await prisma.notification.deleteMany({ where: { conversationId: conv.id } })
    await prisma.message.deleteMany({ where: { conversationId: conv.id } })
    await prisma.conversation.delete({ where: { id: conv.id } })
  }

  console.log('Todas las conversaciones eliminadas.')
  await prisma.$disconnect()
}

main().catch(console.error)
