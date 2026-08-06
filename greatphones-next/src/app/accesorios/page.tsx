import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { AccessoryGrid } from '@/components/AccessoryCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Accesorios — Great Phones',
  description: 'Cargadores, fundas, auriculares, cables y más accesorios para tu celular.',
  openGraph: { title: 'Accesorios — Great Phones', description: 'Cargadores, fundas, auriculares y más.', type: 'website' },
}

export default async function AccesoriosPage() {
  const accessories = await prisma.accessory.findMany({ where: { stock: { gt: 0 } }, orderBy: { createdAt: 'desc' }, take: 200 })

  return (
    <div className="page-xl">
      <h1 className="page-h1">Accesorios</h1>
      <p className="page-sub">{accessories.length} accesorios disponibles</p>
      <AccessoryGrid accessories={JSON.parse(JSON.stringify(accessories))} />
    </div>
  )
}
