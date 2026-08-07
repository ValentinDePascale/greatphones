import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface DashboardData {
  month: { revenue: number; orders: number }
  today: { revenue: number; orders: number }
  avgTicket: number
  topProducts: { name: string; count: number }[]
  brandSales: { brand: string; revenue: number }[]
  recentOrders: { code: string; clientName: string; total: number; status: string; payment: string; createdAt: string }[]
  payments: { method: string; count: number }[]
}

function fmt(n: number) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  return '$' + n.toLocaleString('es-AR')
}

export default async function AdminDashboard() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const where = { status: { not: 'CANCELLED' as const } }

  const [today, month, totalOrders, topProducts, brandSales, recentOrders, payments] = await Promise.all([
    prisma.order.aggregate({ where: { ...where, createdAt: { gte: todayStart } }, _count: true, _sum: { total: true } }),
    prisma.order.aggregate({ where: { ...where, createdAt: { gte: monthStart } }, _count: true, _sum: { total: true } }),
    prisma.order.aggregate({ where, _count: true, _sum: { total: true } }),
    prisma.orderItem.groupBy({ by: ['productId'], _count: true, orderBy: { _count: { productId: 'desc' } }, take: 5 }),
    prisma.$queryRaw<{ brand: string; revenue: bigint }[]>`
      SELECT COALESCE(p.brand, a.brand, 'Sin marca') as brand, COALESCE(SUM(oi."price"), 0)::int as revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON p.id = oi."productId"
      LEFT JOIN "Accessory" a ON a.id = oi."accessoryId"
      WHERE o.status != 'CANCELLED'
      GROUP BY COALESCE(p.brand, a.brand, 'Sin marca')
      ORDER BY revenue DESC LIMIT 6
    `,
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take: 8, select: { code: true, clientName: true, total: true, status: true, payment: true, createdAt: true } }),
    prisma.order.groupBy({ by: ['payment'], where, _count: true }),
  ])

  const productIds = topProducts.map(p => p.productId)
  const products = productIds.length > 0 ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }) : []
  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]))
  const avgTicket = totalOrders._count > 0 ? Math.round(totalOrders._sum.total! / totalOrders._count) : 0

  const kpis = [
    { label: 'Ingresos del mes', value: fmt(month._sum.total || 0), change: null, color: '#FF6B2C' },
    { label: 'Pedidos del mes', value: String(month._count), change: null, color: '#2D5A27' },
    { label: 'Ticket promedio', value: fmt(avgTicket), change: null, color: '#8B7355' },
    { label: 'Ventas hoy', value: fmt(today._sum.total || 0) + ' (' + today._count + ' ped)', change: null, color: '#1a1a1a' },
  ]

  const maxBrandRev = Math.max(...brandSales.map(b => Number(b.revenue)), 1)

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Dashboard</h1>
      <p style={{ fontSize: 13, color: '#9A9186', marginBottom: 24 }}>Resumen de ventas y métricas</p>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem' }}>
            <div style={{ fontSize: 11, color: '#9A9186', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color, fontFamily: "'Playfair Display', serif" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Brand sales chart */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Ventas por marca</h3>
          {brandSales.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9A9186' }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {brandSales.map(b => (
                <div key={b.brand} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: '#1a1a1a', textAlign: 'right' }}>{b.brand}</div>
                  <div style={{ flex: 1, height: 24, background: '#EDE6D8', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(Number(b.revenue) / maxBrandRev) * 100}%`, background: 'linear-gradient(135deg, #FF6B2C, #e55a1a)', borderRadius: 6, minWidth: 4, transition: 'width .3s' }} />
                  </div>
                  <div style={{ width: 70, fontSize: 12, fontWeight: 700, color: '#FF6B2C' }}>{fmt(Number(b.revenue))}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Productos más vendidos</h3>
          {topProducts.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9A9186' }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topProducts.map((p, i) => (
                <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topProducts.length - 1 ? '1px solid #F0EBE3' : 'none' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: '#EDE6D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1a1a1a', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productMap[p.productId] || p.productId.substring(0, 8)}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2D5A27' }}>{p._count} ventas</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem', marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Últimos pedidos</h3>
        {recentOrders.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9A9186' }}>Sin pedidos</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E4DDD4' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Código</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Cliente</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Total</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Estado</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Pago</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.code} style={{ borderBottom: '1px solid #F0EBE3' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{o.code}</td>
                  <td style={{ padding: '10px 12px' }}>{o.clientName || '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{fmt(o.total)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: o.status === 'COMPLETED' ? 'rgba(45,90,39,.1)' : o.status === 'PENDING' ? 'rgba(255,107,44,.1)' : 'rgba(192,57,43,.1)',
                      color: o.status === 'COMPLETED' ? '#2D5A27' : o.status === 'PENDING' ? '#FF6B2C' : '#c0392b',
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11 }}>{o.payment || '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: '#9A9186' }}>
                    {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment breakdown */}
      {payments.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem', marginTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Métodos de pago</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {payments.map(p => (
              <div key={p.payment} style={{ padding: '12px 20px', background: '#FDF8F3', borderRadius: 12, border: '1px solid #E4DDD4', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', fontFamily: "'Playfair Display', serif" }}>{p._count}</div>
                <div style={{ fontSize: 11, color: '#9A9186', marginTop: 2 }}>{p.payment || 'N/E'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
