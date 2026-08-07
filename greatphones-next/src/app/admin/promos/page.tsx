import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function fmt(n: number) { return '$' + n.toLocaleString('es-AR') }

export default async function AdminPromos() {
  const [offerProducts, offerAccessories] = await Promise.all([
    prisma.product.findMany({ where: { isOffer: true, discount: { gt: 0 } }, orderBy: { discount: 'desc' } }),
    prisma.accessory.findMany({ where: { isOffer: true, discount: { gt: 0 } }, orderBy: { discount: 'desc' } }),
  ])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Promociones</h1>
          <p style={{ fontSize: 13, color: '#9A9186' }}>{offerProducts.length + offerAccessories.length} productos en oferta</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E4DDD4', background: '#FDF8F3' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Producto</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Tipo</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Precio</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Descuento</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Estado</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Vence</th>
            </tr>
          </thead>
          <tbody>
            {[...offerProducts.map(p => ({ ...p, _type: 'Producto' })), ...offerAccessories.map(a => ({ ...a, _type: 'Accesorio' }))].map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #F0EBE3' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>{item.name}</td>
                <td style={{ padding: '10px 16px', fontSize: 11, color: '#6B6259' }}>{item._type}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(item.price)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: 'rgba(192,57,43,.1)', color: '#c0392b' }}>-{item.discount}%</span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  {item.offerEnd ? (
                    new Date(item.offerEnd) > new Date()
                      ? <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'rgba(45,90,39,.1)', color: '#2D5A27' }}>Activa</span>
                      : <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'rgba(192,57,43,.1)', color: '#c0392b' }}>Vencida</span>
                  ) : (
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: 'rgba(45,90,39,.1)', color: '#2D5A27' }}>Activa</span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: '#9A9186' }}>
                  {item.offerEnd ? new Date(item.offerEnd).toLocaleDateString('es-AR') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
