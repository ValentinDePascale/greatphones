import { prisma } from './src/lib/prisma.js'

async function deleteQuote() {
  try {
    // Buscar todas las cotizaciones
    const quotes = await prisma.quote.findMany({
      take: 50
    })

    console.log('Total cotizaciones:', quotes.length)
    
    // Buscar la cotización específica
    const quoteToDelete = quotes.find(q => 
      q.clientName && q.clientName.toLowerCase().includes('valentin') &&
      q.device && q.device.toLowerCase().includes('iphone 13 pro')
    )
    
    if (quoteToDelete) {
      console.log('\nCotización encontrada:')
      console.log(`ID: ${quoteToDelete.id}`)
      console.log(`Code: ${quoteToDelete.code}`)
      console.log(`Device: ${quoteToDelete.device} ${quoteToDelete.storage}`)
      console.log(`Client: ${quoteToDelete.clientName}`)
      console.log(`Status: ${quoteToDelete.status}`)
      
      console.log('\n⚠️  ELIMINANDO...')
      await prisma.quote.delete({
        where: { id: quoteToDelete.id }
      })
      console.log('✓ Cotización eliminada exitosamente')
    } else {
      console.log('\nNo se encontró la cotización del iPhone 13 Pro de Valentin')
      console.log('\nCotizaciones disponibles:')
      quotes.slice(0, 10).forEach(q => {
        console.log(`- ${q.device} ${q.storage} | ${q.clientName} | ${q.code}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

deleteQuote()
