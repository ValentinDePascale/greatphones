import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmt(n: number) {
  return '$' + n.toLocaleString('es-AR')
}

interface SearchParams { search?: string }

export default async function AdminProductos({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { search } = await searchParams

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { brand: { contains: search, mode: 'insensitive' as const } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.product.count({ where }),
  ])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Productos</h1>
          <p style={{ fontSize: 13, color: '#9A9186' }}>{total} producto{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/" style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          + Nuevo
        </Link>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #E4DDD4', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E4DDD4', background: '#FDF8F3' }}>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Producto</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Marca</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Precio</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Costo</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Stock</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Vendidos</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#9A9186' }}>Oferta</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F0EBE3', transition: 'background .15s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#faf9f7' }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}>
                <td style={{ padding: '10px 16px' }}>
                  <Link href={`/productos/${p.id}`} style={{ color: '#1a1a1a', textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
                    {p.ico || '📱'} {p.name}
                  </Link>
                  {p.sub && <div style={{ fontSize: 10, color: '#9A9186', marginTop: 2 }}>{p.sub}</div>}
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#6B6259' }}>{p.brand}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  <span style={{ color: p.isOffer ? '#FF6B2C' : '#1a1a1a' }}>{fmt(p.price)}</span>
                  {p.isOffer && <span style={{ fontSize: 10, color: '#c0392b', marginLeft: 4 }}>-{p.discount}%</span>}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: '#6B6259' }}>{fmt(p.cost)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    background: p.stock > 5 ? 'rgba(45,90,39,.1)' : p.stock > 0 ? 'rgba(255,107,44,.1)' : 'rgba(192,57,43,.1)',
                    color: p.stock > 5 ? '#2D5A27' : p.stock > 0 ? '#FF6B2C' : '#c0392b',
                  }}>
                    {p.stock}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{p.sold || 0}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  {p.isOffer ? <span style={{ color: '#c0392b', fontWeight: 700, fontSize: 12 }}>-{p.discount}%</span> : <span style={{ color: '#9A9186' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9A9186', fontSize: 14 }}>
            No se encontraron productos
          </div>
        )}
      </div>
    </div>
  )
}
