const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const u = await p.user.findFirst({ where: { role: 'ADMIN' } })
  if (!u) { console.log('No admin user found'); return }
  
  const code = 'GP-TEST-0002'
  const gc = await p.giftCard.create({
    data: {
      code,
      originalAmount: 50000,
      remainingAmount: 50000,
      status: 'ACTIVE',
      buyerEmail: u.email,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  })
  
  console.log('GiftCard creada: ' + gc.code + ' - $' + Number(gc.originalAmount).toLocaleString('es-AR'))
  console.log('')
  console.log('Canjea este codigo en la pagina:')
  console.log('  ' + gc.code)
}

main().catch(console.error).finally(() => p.$disconnect())
