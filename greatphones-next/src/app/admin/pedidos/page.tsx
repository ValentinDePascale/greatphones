import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function fmt(n: number) { return '$' + n.toLocaleString('es-AR') }

export default async function AdminPedidos() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, code: true, clientName: true, total: true, status: true, payment: true, createdAt: true },
  })

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>Pedidos</h1>
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E4DDD4', background: '#FDF8F3' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Código</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Cliente</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Total</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Estado</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Pago</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid #F0EBE3' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{o.code}</td>
                <td style={{ padding: '10px 16px' }}>{o.clientName || '—'}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>{fmt(o.total)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: o.status === 'COMPLETED' ? 'rgba(45,90,39,.1)' : o.status === 'PENDING' ? 'rgba(255,107,44,.1)' : 'rgba(192,57,43,.1)',
                    color: o.status === 'COMPLETED' ? '#2D5A27' : o.status === 'PENDING' ? '#FF6B2C' : '#c0392b',
                  }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11 }}>{o.payment || '—'}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: '#9A9186' }}>
                  {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
