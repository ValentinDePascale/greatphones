'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 9,
  border: '1.5px solid #E6E7F0',
  borderRadius: 9,
  fontSize: 13,
  background: '#FBFBFD',
  color: '#181B2E',
}

function fmtP(n: number) {
  return '$' + (n || 0).toLocaleString('es-AR')
}
function fmtUSD(n: number) {
  return 'US$' + (n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface Entry {
  id: string
  source: string
  operationId: string | null
  description: string
  category: string | null
  type: string
  means: string
  amount: number
  amountUsd?: number | null
  opDate: string
  operator: string | null
}
interface Balance {
  means: string
  balance: number
  balanceUsd?: number | null
}

const MEAN_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  CUOTAS: 'Cuotas',
  USD: 'USD',
  PAGO_ONLINE: 'Online',
}
const CANAL: Record<string, 'online' | 'local' | 'otro'> = {
  ONLINE: 'online',
  PREORDER: 'online',
  SALE: 'local',
  REPAIR: 'local',
  PURCHASE: 'local',
}

export default function ReportesClient() {
  const [balances, setBalances] = useState<Balance[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [resumen, setResumen] = useState<
    Array<{ source: string; ingresos: number; egresos: number; cantidad: number }>
  >([])
  const [canales, setCanales] = useState<{
    online: { total: number; cantidad: number }
    local: { total: number; cantidad: number }
    egresos: { total: number; cantidad: number }
    otros: { total: number; cantidad: number }
  } | null>(null)
  const [pedidosOnline, setPedidosOnline] = useState<{ total: number; cantidad: number }>({
    total: 0,
    cantidad: 0,
  })
  const [dolar, setDolar] = useState(0)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [filtroCanal, setFiltroCanal] = useState<'todos' | 'online' | 'local'>('todos')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [buscar, setBuscar] = useState('')
  const [cargando, setCargando] = useState(true)

  const load = async () => {
    setCargando(true)
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    const q = params.toString()
    try {
      const [r, rd] = await Promise.all([
        fetch('/api/admin/analisis/reportes' + (q ? '?' + q : ''), { credentials: 'include' }),
        fetch('/api/admin/precios/dolar?tipo=blue', { credentials: 'include' }),
      ])
      const d = await r.json()
      setBalances(d.balances || [])
      setEntries(d.entries || [])
      setResumen(d.resumen || [])
      setCanales(d.canales)
      setPedidosOnline(d.pedidosOnline || { total: 0, cantidad: 0 })
      const dt = await rd.json()
      if (dt && dt.venta) setDolar(dt.venta)
    } catch {}
    setCargando(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = useMemo(() => {
    return entries.filter(e => {
      if (filtroCanal === 'online' && CANAL[e.source] !== 'online') return false
      if (filtroCanal === 'local' && CANAL[e.source] !== 'local') return false
      if (filtroCanal === 'todos' && filtroTipo === 'EGRESO' && e.type !== 'EGRESO') return false
      if (filtroCanal === 'todos' && filtroTipo === 'INGRESO' && e.type !== 'INGRESO') return false
      if (
        buscar &&
        !(e.operationId || '').toLowerCase().includes(buscar.toLowerCase()) &&
        !e.description.toLowerCase().includes(buscar.toLowerCase())
      )
        return false
      return true
    })
  }, [entries, filtroCanal, filtroTipo, buscar])

  const totalIngresos = filtrados
    .filter(e => e.type === 'INGRESO')
    .reduce((s, e) => s + e.amount, 0)
  const totalEgresos = filtrados.filter(e => e.type === 'EGRESO').reduce((s, e) => s + e.amount, 0)

  const bal: Record<string, Balance> = balances.reduce((acc: Record<string, Balance>, b) => {
    acc[b.means] = b
    return acc
  }, {})
  const usdPesos = Math.round((bal.USD?.balanceUsd || 0) * dolar)

  const canalCard = (
    icon: string,
    label: string,
    value: number,
    cantidad: number,
    accent: string,
  ) => (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E6E7F0',
        borderRadius: 12,
        padding: 14,
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          color: '#6B7280',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, color: accent }}
          aria-hidden="true"
        >
          {icon}
        </span>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#181B2E', marginTop: 4 }}>
        {fmtP(value)}
      </div>
      <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>{cantidad} movimientos</div>
    </div>
  )

  return (
    <>
      <AdminTopbar titulo="Reportes" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        <style>{`
          .pe-input:focus{ border-color:#FF6B2C!important; outline:none}
          .pe-btn:focus-visible{ outline:2px solid #FF6B2C; outline-offset:2px}
          .r-chip{ transition: background .15s}
          .r-chip:hover{ filter:brightness(.96)}
        `}</style>

        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>
          Todos los ingresos del sistema — online y local
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'end',
            flexWrap: 'wrap',
            marginTop: 16,
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ flex: '1 1 140px' }}>
            <label
              htmlFor="r-desde"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#3D4356',
                marginBottom: 5,
              }}
            >
              Desde
            </label>
            <input
              id="r-desde"
              type="date"
              className="pe-input"
              style={inputStyle}
              value={desde}
              onChange={e => setDesde(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label
              htmlFor="r-hasta"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#3D4356',
                marginBottom: 5,
              }}
            >
              Hasta
            </label>
            <input
              id="r-hasta"
              type="date"
              className="pe-input"
              style={inputStyle}
              value={hasta}
              onChange={e => setHasta(e.target.value)}
            />
          </div>
          <button
            onClick={load}
            className="pe-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              background: 'linear-gradient(135deg,#FF6B2C,#FF8A50)',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">
              filter_alt
            </span>
            Filtrar
          </button>
        </div>

        {cargando ? (
          <p style={{ textAlign: 'center', color: '#8892A6', padding: 32, fontSize: 13 }}>
            Cargando reportes…
          </p>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                gap: 12,
                marginTop: 16,
              }}
            >
              {canales &&
                canalCard(
                  'laptop',
                  'Ingresos Online',
                  canales.online.total,
                  canales.online.cantidad,
                  '#7C3AED',
                  
                )}
              {canales &&
                canalCard(
                  'storefront',
                  'Ingresos Local',
                  canales.local.total,
                  canales.local.cantidad,
                  '#0F766E',
                  
                )}
              {canales &&
                canalCard(
                  'trending_down',
                  'Egresos',
                  canales.egresos.total,
                  canales.egresos.cantidad,
                  '#DC2626',
                  
                )}
              {canales &&
                canalCard(
                  'swap_horiz',
                  'Otros ingresos',
                  canales.otros.total,
                  canales.otros.cantidad,
                  '#B7950B',
                  
                )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
                gap: 12,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E6E7F0',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#6B7280',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: '#0F9D58' }}
                    aria-hidden="true"
                  >
                    payments
                  </span>
                  Efectivo
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#181B2E', marginTop: 4 }}>
                  {fmtP(bal.EFECTIVO?.balance || 0)}
                </div>
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E6E7F0',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#6B7280',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: '#2563EB' }}
                    aria-hidden="true"
                  >
                    account_balance
                  </span>
                  Transferencia
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#181B2E', marginTop: 4 }}>
                  {fmtP(bal.TRANSFERENCIA?.balance || 0)}
                </div>
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E6E7F0',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#6B7280',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: '#0F766E' }}
                    aria-hidden="true"
                  >
                    attach_money
                  </span>
                  USD
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#181B2E', marginTop: 4 }}>
                  {fmtUSD(bal.USD?.balanceUsd || 0)}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  ≈ {fmtP(usdPesos)} {dolar ? `a ${fmtP(dolar)}` : ''}
                </div>
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E6E7F0',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#6B7280',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, color: '#7C3AED' }}
                    aria-hidden="true"
                  >
                    credit_card
                  </span>
                  Cuotas
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#181B2E', marginTop: 4 }}>
                  {fmtP(bal.CUOTAS?.balance || 0)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
                gap: 10,
                marginTop: 18,
              }}
            >
              {resumen.map(r => (
                <div
                  key={r.source || 'OTRO'}
                  style={{
                    background: '#FAFBFD',
                    border: '1px solid #EDF0F6',
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#6B7280',
                      letterSpacing: '.04em',
                    }}
                  >
                    {r.source || 'OTRO'}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#0F766E', fontWeight: 700, marginTop: 4 }}>
                    Ingresos: {fmtP(r.ingresos)}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#DC2626' }}>Egresos: {fmtP(r.egresos)}</div>
                  <div style={{ fontSize: 11, color: '#8892A6', marginTop: 2 }}>
                    {r.cantidad} movs
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: '#fff',
                border: '1px solid #E6E7F0',
                borderRadius: 14,
                padding: 20,
                marginTop: 20,
                boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#181B2E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: '#FF6B2C' }}
                  aria-hidden="true"
                >
                  menu_book
                </span>
                Libro Diario
              </h3>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                <select
                  className="pe-input"
                  style={{ ...inputStyle, flex: '0 1 160px' }}
                  value={filtroCanal}
                  onChange={e => setFiltroCanal(e.target.value as 'todos' | 'online' | 'local')}
                >
                  <option value="todos">Todos los canales</option>
                  <option value="online">Solo online</option>
                  <option value="local">Solo local</option>
                </select>
                <select
                  className="pe-input"
                  style={{ ...inputStyle, flex: '0 1 150px' }}
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  <option value="INGRESO">Ingresos</option>
                  <option value="EGRESO">Egresos</option>
                </select>
                <div
                  style={{
                    flex: '1 1 220px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 10px',
                    border: '1.5px solid #E6E7F0',
                    borderRadius: 9,
                    background: '#FBFBFD',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: '#94A3B8' }}
                    aria-hidden="true"
                  >
                    search
                  </span>
                  <input
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      padding: '9px 0',
                      fontSize: 13,
                    }}
                    placeholder="Buscar N° operación o descripción..."
                    value={buscar}
                    onChange={e => setBuscar(e.target.value)}
                    aria-label="Buscar operación"
                  />
                  {buscar && (
                    <button
                      onClick={() => setBuscar('')}
                      aria-label="Limpiar"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        display: 'flex',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16 }}
                        aria-hidden="true"
                      >
                        close
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <div
                  style={{
                    background: '#EAFAF1',
                    border: '1px solid #ABEBC6',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>Ingresos</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#166534' }}>
                    {fmtP(totalIngresos)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#F9EBEA',
                    border: '1px solid #F5B7B1',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#943126' }}>Egresos</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#943126' }}>
                    {fmtP(totalEgresos)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#FAFBFD',
                    border: '1px solid #EDF0F6',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Saldo neto</div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: totalIngresos - totalEgresos >= 0 ? '#0F9D58' : '#DC2626',
                    }}
                  >
                    {fmtP(totalIngresos - totalEgresos)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#FAFBFD',
                    border: '1px solid #EDF0F6',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Movimientos</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#181B2E' }}>
                    {filtrados.length}
                  </div>
                </div>
              </div>

              {pedidosOnline.cantidad > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    background: '#FAF5FF',
                    border: '1px solid #EDE9FE',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: '#7C3AED' }}
                    aria-hidden="true"
                  >
                    shopping_cart
                  </span>
                  <span>
                    <b>Pedidos online pagados:</b> {pedidosOnline.cantidad} · Total{' '}
                    {fmtP(pedidosOnline.total)}
                  </span>
                </div>
              )}

              <div
                style={{
                  overflowX: 'auto',
                  marginTop: 14,
                  border: '1px solid #E6E7F0',
                  borderRadius: 8,
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
                      <th style={{ padding: 8, whiteSpace: 'nowrap' }}>Fecha</th>
                      <th style={{ padding: 8 }}>Canal</th>
                      <th style={{ padding: 8 }}>N° Operación</th>
                      <th style={{ padding: 8 }}>Tipo</th>
                      <th style={{ padding: 8 }}>Medio</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Monto</th>
                      <th style={{ padding: 8 }}>Descripción</th>
                      <th style={{ padding: 8 }}>Operador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          style={{ padding: 24, textAlign: 'center', color: '#8892A6' }}
                        >
                          Sin movimientos para este filtro.
                        </td>
                      </tr>
                    )}
                    {filtrados.map(e => (
                      <tr key={e.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                        <td
                          style={{
                            padding: 8,
                            whiteSpace: 'nowrap',
                            color: '#6B7280',
                            fontSize: 12,
                          }}
                        >
                          {new Date(e.opDate).toLocaleString('es-AR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td style={{ padding: 8 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 100,
                              background:
                                CANAL[e.source] === 'online'
                                  ? '#F1E9FE'
                                  : CANAL[e.source] === 'local'
                                    ? '#F0FDFA'
                                    : '#FAFBFD',
                              color:
                                CANAL[e.source] === 'online'
                                  ? '#7C3AED'
                                  : CANAL[e.source] === 'local'
                                    ? '#0F766E'
                                    : '#6B7280',
                              border: '1px solid #E6E7F0',
                            }}
                          >
                            {CANAL[e.source] === 'online'
                              ? 'Online'
                              : CANAL[e.source] === 'local'
                                ? 'Local'
                                : e.source}
                          </span>
                        </td>
                        <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 11.5 }}>
                          {e.operationId || '—'}
                        </td>
                        <td style={{ padding: 8 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 100,
                              background: e.type === 'INGRESO' ? '#D5F5E3' : '#FDEDEC',
                              color: e.type === 'INGRESO' ? '#166534' : '#943126',
                              border: `1px solid ${e.type === 'INGRESO' ? '#ABEBC6' : '#F5B7B1'}`,
                            }}
                          >
                            {e.type}
                          </span>
                        </td>
                        <td style={{ padding: 8 }}>{MEAN_LABEL[e.means] || e.means}</td>
                        <td style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>
                          {fmtP(e.amount)}
                          {e.amountUsd ? ` (${fmtUSD(e.amountUsd)})` : ''}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            maxWidth: 220,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={e.description}
                        >
                          {e.description}
                        </td>
                        <td style={{ padding: 8, color: '#6B7280' }}>{e.operator || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
