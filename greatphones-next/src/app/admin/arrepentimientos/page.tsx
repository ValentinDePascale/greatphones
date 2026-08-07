import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminArrepentimientos() {
  const arreps = await prisma.arrepentimiento.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { order: { select: { code: true, total: true } } },
  })

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>Arrepentimientos</h1>
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E4DDD4', background: '#FDF8F3' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Pedido</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Email</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Estado</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Motivo</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {arreps.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #F0EBE3' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{a.order?.code || '—'}</td>
                <td style={{ padding: '10px 16px', fontSize: 12 }}>{a.email}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: a.estado === 'APROBADO' ? 'rgba(45,90,39,.1)' : a.estado === 'PENDIENTE' ? 'rgba(255,107,44,.1)' : 'rgba(192,57,43,.1)',
                    color: a.estado === 'APROBADO' ? '#2D5A27' : a.estado === 'PENDIENTE' ? '#FF6B2C' : '#c0392b',
                  }}>
                    {a.estado}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 11, color: '#6B6259', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.motivo || '—'}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: '#9A9186' }}>
                  {new Date(a.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {arreps.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9A9186', fontSize: 14 }}>
            No hay arrepentimientos
          </div>
        )}
      </div>
    </div>
  )
}
