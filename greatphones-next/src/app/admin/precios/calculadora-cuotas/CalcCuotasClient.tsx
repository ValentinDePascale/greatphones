'use client'

import { useEffect, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'
import { fmtARS } from '@/lib/precios'

interface CuotaRow {
  id: string
  cuotas: number
  coeficiente: number
  activo: boolean
  mostrar: boolean
  observacion?: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  border: '1.5px solid #E6E7F0',
  borderRadius: 9,
  fontSize: 13,
  background: '#FBFBFD',
  color: '#181B2E',
  transition: 'border-color .15s',
}

export default function CalcCuotasClient() {
  const [rows, setRows] = useState<CuotaRow[]>([])
  const [monto, setMonto] = useState('')
  const [resultado, setResultado] = useState<
    Array<{ cuotas: number; total: number; valorCuota: number }>
  >([])
  const [calculado, setCalculado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    fetch('/api/admin/precios/cuotas', { credentials: 'include' })
      .then(r => {
        if (!r.ok) throw new Error('cuotas')
        return r.json()
      })
      .then(d => {
        if (activo) setRows(Array.isArray(d) ? d.filter(c => c.mostrar && c.activo) : [])
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar la configuración de cuotas. Recargá la página.')
      })
    return () => {
      activo = false
    }
  }, [])

  const calcular = () => {
    const m = Number(monto) || 0
    if (m <= 0) {
      setResultado([])
      setCalculado(false)
      return
    }
    const res = rows.map(c => {
      const total = Math.round(m * c.coeficiente)
      return { cuotas: c.cuotas, total, valorCuota: Math.round(total / c.cuotas) }
    })
    setResultado(res)
    setCalculado(true)
  }

  const mayorValorCuota = calculado ? Math.max(...resultado.map(r => r.valorCuota), 0) : 0

  return (
    <>
      <AdminTopbar titulo="Calculadora de Cuotas" />

      <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 4px' }}>
          Simula opciones de pago en cuotas. Los coeficientes se editan en Precios.
        </p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 16px' }}>
          Ingresá un precio y verás cuánto cuesta cada cuota con interés incluido.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '11px 14px',
              marginBottom: 16,
              color: '#B91C1C',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={ev => {
            ev.preventDefault()
            calcular()
          }}
          style={{
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 14,
            padding: 24,
            boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)',
          }}
        >
          <label
            htmlFor="cc-monto"
            style={{
              display: 'block',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#3D4356',
              marginBottom: 8,
            }}
          >
            Monto ($)
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="cc-monto"
              type="number"
              min={0}
              className="pe-input"
              style={inputStyle}
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0"
              aria-describedby="cc-ayuda"
            />
            <button
              type="submit"
              className="pe-btn"
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg,#FF6B2C,#FF8A50)',
                color: '#fff',
                padding: '0 20px',
                border: 'none',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
                aria-hidden="true"
              >
                calculate
              </span>
              Calcular
            </button>
          </div>
          <p id="cc-ayuda" style={{ fontSize: 11.5, color: '#94A3B8', margin: '8px 0 0' }}>
            Ingresá el precio del equipo y presioná Enter para ver las opciones de pago.
          </p>

          {calculado && (
            <div
              role="status"
              aria-label="Resultados"
              style={{ display: 'grid', gap: 10, marginTop: 18 }}
            >
              {resultado.length === 0 && (
                <div style={{ textAlign: 'center', color: '#8892A6', padding: 20 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 30, color: '#C3C9D6', display: 'block', marginBottom: 4 }}
                    aria-hidden="true"
                  >
                    money_off
                  </span>
                  No hay coeficientes configurados.
                </div>
              )}
              {resultado.map(r => (
                <div
                  key={r.cuotas}
                  style={{
                    background:
                      r.valorCuota === mayorValorCuota && r.cuotas === 1 ? '#FFF8F2' : '#FAFBFD',
                    border: `1px solid ${r.valorCuota === mayorValorCuota && r.cuotas === 1 ? '#FFD3BC' : '#EDF0F6'}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#181B2E', fontSize: 14 }}>
                      {r.cuotas === 1 ? '1 pago' : `${r.cuotas} cuotas`}
                    </div>
                    {r.cuotas > 1 && (
                      <>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                          Total: {fmtARS(r.total)}
                        </div>
                        <div style={{ fontSize: 11, color: '#D97706', marginTop: 2 }}>
                          +{fmtARS(r.total - (Number(monto) || 0))} de interés
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#E85A17' }}>
                      {r.cuotas === 1 ? fmtARS(r.total) : `${fmtARS(r.valorCuota)}`}
                    </div>
                    {r.cuotas > 1 && (
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>por cuota</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <style>{`
        .pe-input:focus { border-color: #FF6B2C !important; outline: none; }
        .pe-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
      `}</style>
    </>
  )
}
