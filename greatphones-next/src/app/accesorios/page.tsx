import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { AccessoryGrid } from '@/components/AccessoryCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Accesorios — Great Phones',
  description: 'Cargadores, fundas, auriculares, cables y más accesorios para tu celular.',
  openGraph: {
    title: 'Accesorios — Great Phones',
    description: 'Cargadores, fundas, auriculares, cables y más.',
    type: 'website',
  },
}

export default async function AccesoriosPage() {
  const accessories = await prisma.accessory.findMany({
    where: { stock: { gt: 0 } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(28px, 4vw, 40px)',
          fontWeight: 700, color: '#1a1a1a', marginBottom: 8,
        }}>
          Accesorios
        </h1>
        <p style={{ fontSize: 14, color: '#9A9186' }}>
          {accessories.length} accesorios disponibles
        </p>
      </div>
      <AccessoryGrid accessories={JSON.parse(JSON.stringify(accessories))} />
    </div>
  )
}
