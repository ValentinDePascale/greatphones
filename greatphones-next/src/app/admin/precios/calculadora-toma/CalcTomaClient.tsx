'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'
import { fmtARS } from '@/lib/precios'
import type { TomaRow } from '../toma/TomaVista'
import type { PrecioRow } from '../PrecioEditor'

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
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: '#3D4356',
  marginBottom: 5,
}

const FALLAS: Array<
  'bateria' | 'pantalla' | 'camara' | 'microfono' | 'parlante' | 'tapa' | 'marco' | 'pin'
> = ['bateria', 'pantalla', 'camara', 'microfono', 'parlante', 'tapa', 'marco', 'pin']
const FALLA_LABEL: Record<string, string> = {
  bateria: 'Batería',
  pantalla: 'Pantalla',
  camara: 'Cámara',
  microfono: 'Micrófono',
  parlante: 'Parlante',
  tapa: 'Tapa trasera',
  marco: 'Marco',
  pin: 'Pin de carga',
}

export default function CalcTomaClient() {
  const [tomaItems, setTomaItems] = useState<TomaRow[]>([])
  const [listaItems, setListaItems] = useState<PrecioRow[]>([])
  const [ctModelo, setCtModelo] = useState('')
  const [cjModelo, setCjModelo] = useState('')
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>({})
  const [tipoVenta, setTipoVenta] = useState<'normal' | 'preventa'>('normal')

  useEffect(() => {
    let activo = true
    fetch('/api/admin/precios/toma', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (activo) setTomaItems(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
    fetch('/api/admin/precios', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (activo) setListaItems(Array.isArray(d) ? d : [])
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  const equipoToma = useMemo(
    () => tomaItems.find(t => t.modelo === ctModelo) || null,
    [tomaItems, ctModelo],
  )
  const equipoCanje = useMemo(
    () => (cjModelo ? listaItems.filter(p => p.modelo === cjModelo) : []),
    [listaItems, cjModelo],
  )

  const descuentos = useMemo(() => {
    if (!equipoToma) return 0
    return FALLAS.reduce((s, k) => s + (marcadas[k] ? equipoToma[k] : 0), 0)
  }, [equipoToma, marcadas])

  const valorToma = equipoToma ? Math.max(0, (equipoToma.impecable || 0) - descuentos) : 0

  const precioCanje = useMemo(() => {
    if (!equipoCanje.length) return 0
    return tipoVenta === 'preventa'
      ? Math.min(...equipoCanje.map(p => p.preventaARS))
      : Math.min(...equipoCanje.map(p => p.precioARS))
  }, [equipoCanje, tipoVenta])

  const diferencia = precioCanje - valorToma

  const toggleFalla = (k: string) => setMarcadas(m => ({ ...m, [k]: !m[k] }))

  return (
    <>
      <AdminTopbar titulo="Calculadora de Toma" />

      <div style={{ padding: 'clamp(16px,4vw,24px)', maxWidth: 640, margin: '0 auto' }}>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 16px' }}>
          Calcula el valor de toma según las fallas marcadas y lo que debe agregar el cliente en un
          canje.
        </p>

        <section
          style={{
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 14,
            padding: 24,
            boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)',
          }}
          aria-labelledby="ct-toma"
        >
          <h2
            id="ct-toma"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: 0,
              fontSize: 15,
              fontWeight: 800,
              color: '#181B2E',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: '#FF6B2C' }}
              aria-hidden="true"
            >
              smartphone
            </span>
            Equipo que entra (toma)
          </h2>

          <label htmlFor="ct-modelo-input" style={{ ...labelStyle, marginTop: 14 }}>
            Modelo *
          </label>
          <input
            id="ct-modelo-input"
            list="ct-modelos"
            className="pe-input"
            style={inputStyle}
            placeholder="Buscar modelo..."
            value={ctModelo}
            onChange={e => setCtModelo(e.target.value)}
          />
          <datalist id="ct-modelos">
            {tomaItems.map(t => (
              <option key={t.id} value={t.modelo} />
            ))}
          </datalist>

          <p
            style={{
              marginTop: 18,
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 13,
              color: '#334155',
            }}
          >
            Fallas del equipo:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FALLAS.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => toggleFalla(k)}
                aria-pressed={!!marcadas[k]}
                className={marcadas[k] ? 'ct-chip activa' : 'ct-chip'}
                style={{
                  padding: '7px 13px',
                  fontSize: 12.5,
                  borderRadius: 99,
                  cursor: 'pointer',
                  fontWeight: marcadas[k] ? 700 : 500,
                  color: marcadas[k] ? '#fff' : '#475569',
                  background: marcadas[k] ? '#DC2626' : '#EEF0F6',
                  border: 'none',
                  transition: 'background .15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {marcadas[k] && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14 }}
                    aria-hidden="true"
                  >
                    close
                  </span>
                )}
                {FALLA_LABEL[k]}
              </button>
            ))}
          </div>

          <dl
            style={{
              margin: '18px 0 0',
              background: '#FAFBFD',
              border: '1px solid #EDF0F6',
              borderRadius: 10,
              padding: '6px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                padding: '8px 0',
              }}
            >
              <dt style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Precio impecable</dt>
              <dd style={{ fontSize: 13.5, fontWeight: 700, color: '#181B2E', margin: 0 }}>
                {fmtARS(equipoToma?.impecable || 0)}
              </dd>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                padding: '8px 0',
                borderTop: '1px solid #EFF1F6',
              }}
            >
              <dt style={{ fontSize: 13, color: '#C0392B', margin: 0 }}>Descuentos por fallas</dt>
              <dd style={{ fontSize: 13.5, fontWeight: 700, color: '#C0392B', margin: 0 }}>
                -{fmtARS(descuentos)}
              </dd>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                padding: '10px 0',
                borderTop: '1px dashed #D1D5DB',
              }}
            >
              <dt style={{ fontSize: 14, fontWeight: 800, color: '#166534', margin: 0 }}>
                VALOR DE TOMA
              </dt>
              <dd style={{ fontSize: 19, fontWeight: 800, color: '#166534', margin: 0 }}>
                {fmtARS(valorToma)}
              </dd>
            </div>
          </dl>
        </section>

        <section
          style={{
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 14,
            padding: 24,
            marginTop: 20,
            boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)',
          }}
          aria-labelledby="ct-canje"
        >
          <h2
            id="ct-canje"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: 0,
              fontSize: 15,
              fontWeight: 800,
              color: '#181B2E',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: '#FF6B2C' }}
              aria-hidden="true"
            >
              sync_alt
            </span>
            Canje con equipo vendido
          </h2>

          <label htmlFor="cj-modelo-input" style={{ ...labelStyle, marginTop: 14 }}>
            Equipo vendido (Lista de Precios)
          </label>
          <input
            id="cj-modelo-input"
            list="cj-modelos"
            className="pe-input"
            style={inputStyle}
            placeholder="Buscar modelo..."
            value={cjModelo}
            onChange={e => setCjModelo(e.target.value)}
          />
          <datalist id="cj-modelos">
            {listaItems.map(p => (
              <option key={p.id} value={p.modelo} />
            ))}
          </datalist>

          <p
            style={{
              marginTop: 16,
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 13,
              color: '#334155',
            }}
          >
            Tipo de venta:
          </p>
          <div
            role="radiogroup"
            aria-label="Tipo de venta"
            className="ct-tipo-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
          >
            {(
              [
                ['normal', 'Venta normal'],
                ['preventa', 'Preventa'],
              ] as const
            ).map(([v, lab]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={tipoVenta === v}
                onClick={() => setTipoVenta(v)}
                style={{
                  padding: '11px 10px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  border: tipoVenta === v ? '2px solid #FF6B2C' : '1.5px solid #E6E7F0',
                  background: tipoVenta === v ? '#FFF1E8' : '#FBFBFD',
                  color: tipoVenta === v ? '#E85A17' : '#64748B',
                  transition: 'border-color .15s, background .15s',
                }}
              >
                {lab}
              </button>
            ))}
          </div>

          <dl
            style={{
              margin: '18px 0 0',
              background: '#FAFBFD',
              border: '1px solid #EDF0F6',
              borderRadius: 10,
              padding: '6px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                padding: '8px 0',
              }}
            >
              <dt style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Precio venta</dt>
              <dd style={{ fontSize: 13.5, fontWeight: 700, color: '#181B2E', margin: 0 }}>
                {fmtARS(precioCanje)}
              </dd>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                padding: '8px 0',
                borderTop: '1px solid #EFF1F6',
              }}
            >
              <dt style={{ fontSize: 13, color: '#166534', margin: 0 }}>Valor toma</dt>
              <dd style={{ fontSize: 13.5, fontWeight: 700, color: '#166534', margin: 0 }}>
                {fmtARS(equipoToma ? valorToma : 0)}
              </dd>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                padding: '10px 0',
                borderTop: '1px dashed #D1D5DB',
              }}
            >
              <dt style={{ fontSize: 14, fontWeight: 800, color: '#E85A17', margin: 0 }}>
                CLIENTE DEBE AGREGAR
              </dt>
              <dd style={{ fontSize: 19, fontWeight: 800, color: '#E85A17', margin: 0 }}>
                {fmtARS(equipoToma && cjModelo ? diferencia : 0)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <style>{`
         .pe-input:focus { border-color: #FF6B2C !important; outline: none; }
         .ct-chip:hover:not(.activa) { background: #E4E7EF !important; }
         @media (max-width: 380px){ .ct-tipo-grid{ grid-template-columns: 1fr !important; } }
         @media (prefers-reduced-motion: reduce) { .ct-chip { transition: none !important; } }
       `}</style>
    </>
  )
}
