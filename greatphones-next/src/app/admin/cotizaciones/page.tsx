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
    prisma.quote.aggregate({ where: { createdAt: { gte: monthStart } }, _count: true, _sum: { finalPrice: true }, _avg: { finalPrice: true } }),
    prisma.quote.aggregate({ where: { createdAt: { gte: todayStart } }, _count: true, _sum: { finalPrice: true } }),
    prisma.quote.groupBy({ by: ['status'], _count: true, _sum: { finalPrice: true } }),
    prisma.quote.groupBy({ by: ['device'], _count: true, _sum: { finalPrice: true }, orderBy: { _sum: { finalPrice: 'desc' } }, take: 8 }),
    prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { code: true, device: true, storage: true, condition: true, finalPrice: true, status: true, clientName: true, createdAt: true } }),
  ])

  const statusMap: Record<string, string> = { PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }
  const acceptance = monthQuotes._count > 0 ? Math.round(((byStatus.find(s => s.status === 'ACCEPTED')?._count || 0) / monthQuotes._count) * 100) + '%' : '—'
  const maxDeviceCount = Math.max(...byDevice.map(b => b._count), 1)

  const kpisHTML = [
    { label: 'Cotizaciones del mes', value: String(monthQuotes._count), sub: fmt(monthQuotes._sum.finalPrice || 0) },
    { label: 'Cotizaciones hoy', value: String(todayQuotes._count), sub: fmt(todayQuotes._sum.finalPrice || 0) },
    { label: 'Ticket promedio', value: fmt(Math.round(monthQuotes._avg.finalPrice || 0)), sub: 'este mes' },
    { label: 'Tasa de aceptación', value: acceptance },
  ].map(k =>
    `<div style="background:#fff;border-radius:14px;border:1.5px solid var(--border);padding:1.25rem">
      <div style="font-size:11px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:8px">${k.label}</div>
      <div style="font-size:26px;font-weight:700;color:var(--dk);font-family:'Playfair Display',serif">${k.value}</div>
      ${k.sub ? `<div style="font-size:12px;color:#6B6259;margin-top:4px">${k.sub}</div>` : ''}
    </div>`
  ).join('')

  const deviceBarsHTML = byDevice.length === 0
    ? '<p style="font-size:13px;color:var(--gray)">Sin datos</p>'
    : byDevice.map(b =>
      `<div style="display:flex;align-items:center;gap:10px">
        <div style="width:120px;font-size:12px;font-weight:600;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.device}</div>
        <div style="flex:1;height:24px;background:var(--cream2);border-radius:6px;overflow:hidden">
          <div style="height:100%;width:${(b._count / maxDeviceCount) * 100}%;background:linear-gradient(135deg,#8B7355,#6B6259);border-radius:6px;min-width:4px"></div>
        </div>
        <div style="width:50px;font-size:12px;font-weight:700;color:#8B7355;text-align:right">${b._count}</div>
      </div>`
    ).join('')

  const statusCardsHTML = byStatus.length === 0
    ? '<p style="font-size:13px;color:var(--gray)">Sin datos</p>'
    : byStatus.map(s => {
        const color = s.status === 'ACCEPTED' ? '#2D5A27' : s.status === 'PENDING' ? '#FF6B2C' : '#c0392b'
        return `<div style="padding:16px 24px;background:var(--cream);border-radius:12px;border:1px solid var(--border);text-align:center">
          <div style="font-size:22px;font-weight:700;font-family:'Playfair Display',serif;color:${color}">${s._count}</div>
          <div style="font-size:11px;color:var(--gray);margin-top:2px">${statusMap[s.status] || s.status}</div>
          ${s._sum.finalPrice ? `<div style="font-size:11px;font-weight:600;color:#6B6259;margin-top:4px">${fmt(s._sum.finalPrice)}</div>` : ''}
        </div>`
      }).join('')

  const recentHTML = recentQuotes.length === 0
    ? '<p style="font-size:13px;color:var(--gray);padding:2rem;text-align:center">Sin cotizaciones</p>'
    : `<table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="border-bottom:2px solid var(--border);background:var(--cream)">
          <th style="text-align:left;padding:8px 12px;color:var(--gray);font-weight:600;font-size:10px;text-transform:uppercase">Código</th>
          <th style="text-align:left;padding:8px 12px;color:var(--gray);font-weight:600;font-size:10px;text-transform:uppercase">Dispositivo</th>
          <th style="text-align:left;padding:8px 12px;color:var(--gray);font-weight:600;font-size:10px;text-transform:uppercase">Cliente</th>
          <th style="text-align:right;padding:8px 12px;color:var(--gray);font-weight:600;font-size:10px;text-transform:uppercase">Precio</th>
          <th style="text-align:center;padding:8px 12px;color:var(--gray);font-weight:600;font-size:10px;text-transform:uppercase">Estado</th>
          <th style="text-align:right;padding:8px 12px;color:var(--gray);font-weight:600;font-size:10px;text-transform:uppercase">Fecha</th>
        </tr></thead>
        <tbody>${recentQuotes.map(q => {
          const sc = q.status === 'ACCEPTED' ? 'rgba(45,90,39,.1)' : q.status === 'PENDING' ? 'rgba(255,107,44,.1)' : q.status === 'REJECTED' ? 'rgba(192,57,43,.1)' : 'rgba(107,98,89,.1)'
          const scColor = q.status === 'ACCEPTED' ? '#2D5A27' : q.status === 'PENDING' ? '#FF6B2C' : q.status === 'REJECTED' ? '#c0392b' : '#6B6259'
          return `<tr style="border-bottom:1px solid #F0EBE3">
            <td style="padding:10px 12px;font-weight:600;font-family:monospace;font-size:11px">${q.code}</td>
            <td style="padding:10px 12px;font-size:12px">${q.device} ${q.storage ? q.storage+' ' : ''}${q.condition ? '· '+q.condition : ''}</td>
            <td style="padding:10px 12px">${q.clientName || '—'}</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:${q.status==='ACCEPTED'?'#2D5A27':'var(--dk)'}">${fmt(q.finalPrice)}</td>
            <td style="padding:10px 12px;text-align:center"><span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:${sc};color:${scColor}">${statusMap[q.status]||q.status}</span></td>
            <td style="padding:10px 12px;text-align:right;font-size:11px;color:var(--gray)">${new Date(q.createdAt).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'})}</td>
          </tr>`
        }).join('')}</tbody>
      </table>`

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles/globals.css?v=2">
<link rel="stylesheet" href="/styles/components.css?v=2">
<style>body{margin:0;background:var(--cream);font-family:'DM Sans',system-ui,sans-serif;color:var(--dk)}</style>
</head>
<body>
<div style="max-width:1240px;margin:0 auto;padding:2rem clamp(0.875rem,3vw,1.75rem)">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
    <a href="/admin" style="color:var(--orange);text-decoration:none;font-size:13px;font-weight:600">← Admin</a>
  </div>
  <h1 style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:4px">Dashboard de Cotizaciones</h1>
  <p style="font-size:13px;color:var(--gray);margin-bottom:24px">Resumen de cotizaciones y métricas</p>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px">${kpisHTML}</div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
    <div style="background:#fff;border-radius:14px;border:1.5px solid var(--border);padding:1.25rem">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">Por dispositivo</h3>
      <div style="display:flex;flex-direction:column;gap:10px">${deviceBarsHTML}</div>
    </div>
    <div style="background:#fff;border-radius:14px;border:1.5px solid var(--border);padding:1.25rem">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">Por estado</h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap">${statusCardsHTML}</div>
    </div>
  </div>

  <div style="background:#fff;border-radius:14px;border:1.5px solid var(--border);padding:1.25rem">
    <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">Últimas cotizaciones</h3>
    ${recentHTML}
  </div>
</div>
</body>
</html>`

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
