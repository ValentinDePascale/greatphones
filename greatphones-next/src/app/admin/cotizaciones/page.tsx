import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function fmt(n: number) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  return '$' + n.toLocaleString('es-AR')
}

export default async function AdminCotizaciones() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [monthQuotes, todayQuotes, byStatus, byDevice, recentQuotes] = await Promise.all([
    prisma.quote.aggregate({
      where: { createdAt: { gte: monthStart } },
      _count: true,
      _sum: { finalPrice: true },
      _avg: { finalPrice: true },
    }),
    prisma.quote.aggregate({
      where: { createdAt: { gte: todayStart } },
      _count: true,
      _sum: { finalPrice: true },
    }),
    prisma.quote.groupBy({
      by: ['status'],
      _count: true,
      _sum: { finalPrice: true },
    }),
    prisma.quote.groupBy({
      by: ['device'],
      _count: true,
      _sum: { finalPrice: true },
      orderBy: { _sum: { finalPrice: 'desc' } },
      take: 8,
    }),
    prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        code: true, device: true, storage: true, condition: true,
        finalPrice: true, basePrice: true, status: true,
        clientName: true, createdAt: true,
      },
    }),
  ])

  const statusMap: Record<string, string> = {
    PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada',
    COMPLETED: 'Completada', CANCELLED: 'Cancelada',
  }

  const kpis = [
    { label: 'Cotizaciones del mes', value: String(monthQuotes._count), sub: fmt(monthQuotes._sum.finalPrice || 0), color: '#FF6B2C' },
    { label: 'Cotizaciones hoy', value: String(todayQuotes._count), sub: fmt(todayQuotes._sum.finalPrice || 0), color: '#2D5A27' },
    { label: 'Ticket promedio', value: fmt(Math.round(monthQuotes._avg.finalPrice || 0)), sub: 'este mes', color: '#8B7355' },
    {
      label: 'Tasa de aceptación',
      value: monthQuotes._count > 0
        ? Math.round(((byStatus.find(s => s.status === 'ACCEPTED')?._count || 0) / monthQuotes._count) * 100) + '%'
        : '—',
      sub: null, color: '#1a1a1a',
    },
  ]

  const maxDeviceCount = Math.max(...byDevice.map(b => b._count), 1)

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Cotizaciones</h1>
      <p style={{ fontSize: 13, color: '#9A9186', marginBottom: 24 }}>Resumen de cotizaciones y métricas</p>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem' }}>
            <div style={{ fontSize: 11, color: '#9A9186', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color, fontFamily: "'Playfair Display', serif" }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 12, color: '#6B6259', marginTop: 4 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* By device */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Por dispositivo</h3>
          {byDevice.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9A9186' }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byDevice.map(b => (
                <div key={b.device} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 120, fontSize: 12, fontWeight: 600, color: '#1a1a1a', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.device}</div>
                  <div style={{ flex: 1, height: 24, background: '#EDE6D8', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(b._count / maxDeviceCount) * 100}%`, background: 'linear-gradient(135deg, #8B7355, #6B6259)', borderRadius: 6, minWidth: 4 }} />
                  </div>
                  <div style={{ width: 50, fontSize: 12, fontWeight: 700, color: '#8B7355', textAlign: 'right' }}>{b._count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By status */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Por estado</h3>
          {byStatus.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9A9186' }}>Sin datos</p>
          ) : (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {byStatus.map(s => (
                <div key={s.status} style={{ padding: '16px 24px', background: '#FDF8F3', borderRadius: 12, border: '1px solid #E4DDD4', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: s.status === 'ACCEPTED' ? '#2D5A27' : s.status === 'PENDING' ? '#FF6B2C' : '#c0392b' }}>{s._count}</div>
                  <div style={{ fontSize: 11, color: '#9A9186', marginTop: 2 }}>{statusMap[s.status] || s.status}</div>
                  {s._sum.finalPrice ? <div style={{ fontSize: 11, fontWeight: 600, color: '#6B6259', marginTop: 4 }}>{fmt(s._sum.finalPrice)}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent quotes */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', padding: '1.25rem' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Últimas cotizaciones</h3>
        {recentQuotes.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9A9186' }}>Sin cotizaciones</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E4DDD4', background: '#FDF8F3' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Código</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Dispositivo</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Cliente</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Precio</th>
                <th style={{ textAlign: 'center', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Estado</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#9A9186', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentQuotes.map(q => (
                <tr key={q.code} style={{ borderBottom: '1px solid #F0EBE3' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{q.code}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{q.device} {q.storage ? q.storage + ' ' : ''}{q.condition ? '· ' + q.condition : ''}</td>
                  <td style={{ padding: '10px 12px' }}>{q.clientName || '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                    <span style={{ color: q.status === 'ACCEPTED' ? '#2D5A27' : '#1a1a1a' }}>{fmt(q.finalPrice)}</span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                      background: q.status === 'ACCEPTED' ? 'rgba(45,90,39,.1)' : q.status === 'PENDING' ? 'rgba(255,107,44,.1)' : q.status === 'REJECTED' ? 'rgba(192,57,43,.1)' : 'rgba(107,98,89,.1)',
                      color: q.status === 'ACCEPTED' ? '#2D5A27' : q.status === 'PENDING' ? '#FF6B2C' : q.status === 'REJECTED' ? '#c0392b' : '#6B6259',
                    }}>
                      {statusMap[q.status] || q.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: '#9A9186' }}>
                    {new Date(q.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
