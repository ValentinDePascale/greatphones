import { prisma } from './src/lib/prisma'

async function deleteQuote() {
  try {
    // Buscar cotizaciones de Valentin
    const quotes = await prisma.quote.findMany({
      where: {
        clientName: { contains: 'Valentin', mode: 'insensitive' }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    console.log('Cotizaciones encontradas:', quotes.length)
    
    for (const quote of quotes) {
      console.log(`\nID: ${quote.id}`)
      console.log(`Code: ${quote.code}`)
      console.log(`Device: ${quote.device} ${quote.storage}`)
      console.log(`Client: ${quote.clientName}`)
      console.log(`User: ${quote.user?.name || 'N/A'} (${quote.user?.email || 'N/A'})`)
      console.log(`Status: ${quote.status}`)
      console.log(`Created: ${quote.createdAt}`)
      
      // Eliminar si es el iPhone 13 Pro
      if (quote.device.includes('iPhone 13 Pro')) {
        console.log('\n⚠️  ELIMINANDO ESTA COTIZACIÓN...')
        await prisma.quote.delete({
          where: { id: quote.id }
        })
        console.log('✓ Cotización eliminada')
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteQuote()
