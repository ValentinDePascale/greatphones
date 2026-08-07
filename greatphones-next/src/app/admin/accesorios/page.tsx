import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function fmt(n: number) { return '$' + n.toLocaleString('es-AR') }

export default async function AdminAccesorios() {
  const accessories = await prisma.accessory.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>Accesorios</h1>
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E4DDD4', background: '#FDF8F3' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Categoría</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Precio</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Stock</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Compatible con</th>
            </tr>
          </thead>
          <tbody>
            {accessories.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #F0EBE3' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>{a.name}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#6B6259' }}>{a.category || '—'}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(a.price)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: a.stock > 0 ? 'rgba(45,90,39,.1)' : 'rgba(192,57,43,.1)', color: a.stock > 0 ? '#2D5A27' : '#c0392b' }}>{a.stock}</span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 11, color: '#9A9186' }}>{a.compatibleModels || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
