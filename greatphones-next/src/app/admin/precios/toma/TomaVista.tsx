'use client'

import { useEffect, useState } from 'react'
import { fmtARS } from '@/lib/precios'
import { copiarTexto } from '@/lib/precios-client'

export interface TomaRow {
  id: string
  modelo: string
  impecable: number
  bateria: number
  pantalla: number
  camara: number
  microfono: number
  parlante: number
  tapa: number
  marco: number
  pin: number
}

const FALLAS: Array<
  'bateria' | 'pantalla' | 'camara' | 'microfono' | 'parlante' | 'tapa' | 'marco' | 'pin'
> = ['bateria', 'pantalla', 'camara', 'microfono', 'parlante', 'tapa', 'marco', 'pin']
const FALLA_LABEL: Record<string, string> = {
  bateria: 'Bat',
  pantalla: 'Pant',
  camara: 'Cam',
  microfono: 'Mic',
  parlante: 'Parl',
  tapa: 'Tapa',
  marco: 'Marco',
  pin: 'Pin',
}

export default function TomaVista() {
  const [rows, setRows] = useState<TomaRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    fetch('/api/admin/precios/toma', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (activo) {
          setRows(Array.isArray(d) ? d : [])
          setCargando(false)
        }
      })
      .catch(() => {
        if (activo) {
          setError('No se pudieron cargar los precios de toma')
          setCargando(false)
        }
      })
    return () => {
      activo = false
    }
  }, [])

  const avisar = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const filtrados = rows.filter(
    r => !buscar || (r.modelo || '').toLowerCase().includes(buscar.toLowerCase()),
  )

  const copiar = async (r: TomaRow) => {
    const texto =
      `${r.modelo}\n` +
      `Impecable: ${fmtARS(r.impecable)}\n` +
      FALLAS.map(k => `Falta ${FALLA_LABEL[k]}: -${fmtARS(r[k])}`).join('\n')
    await copiarTexto(texto)
    avisar('Tabla de toma copiada')
  }

  return (
    <div>
      <style>{`
        .tv-search:focus-within { border-color: #FF6B2C !important; }
        .tv-search input:focus { outline: none; }
        @media (prefers-reduced-motion: reduce) { .pv-act { transition: none !important; } }
      `}</style>

      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            marginBottom: 16,
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            background: '#DC2626',
          }}
        >
          {error}
        </div>
      )}

      <div
        className="tv-search"
        style={{
          maxWidth: 340,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 10px',
          border: '1.5px solid #E6E7F0',
          borderRadius: 9,
          background: '#FBFBFD',
          marginBottom: 14,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: '#94A3B8' }}
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
            color: '#181B2E',
          }}
          placeholder="Buscar modelo..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          aria-label="Buscar modelo"
        />
        {buscar && (
          <button
            onClick={() => setBuscar('')}
            aria-label="Limpiar búsqueda"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 0,
              display: 'flex',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
              close
            </span>
          </button>
        )}
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            background: '#181B2E',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(23,23,45,.25)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: '#4ADE80' }}
              aria-hidden="true"
            >
              check_circle
            </span>
            {toast}
          </span>
        </div>
      )}

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #E6E7F0', borderRadius: 8 }}>
        <table
          style={{
            width: '100%',
            minWidth: 720,
            borderCollapse: 'collapse',
            fontSize: 12.5,
            whiteSpace: 'nowrap',
          }}
        >
          <thead>
            <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
              <th scope="col" style={{ padding: 8 }}>
                Modelo
              </th>
              <th scope="col" style={{ padding: 8 }}>
                Impecable
              </th>
              {FALLAS.map(k => (
                <th key={k} scope="col" style={{ padding: 8 }}>
                  {FALLA_LABEL[k]}
                </th>
              ))}
              <th scope="col" style={{ padding: 8 }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={11} style={{ padding: 20, textAlign: 'center', color: '#8892A6' }}>
                  Cargando…
                </td>
              </tr>
            )}
            {!cargando && filtrados.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: '#8892A6' }}>
                  {buscar
                    ? 'Sin resultados para tu búsqueda.'
                    : 'No hay modelos cargados. Agregá uno desde la pestaña Editar.'}
                </td>
              </tr>
            )}
            {filtrados.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                <td style={{ padding: 8, fontWeight: 600, color: '#181B2E' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 14,
                      color: '#FF6B2C',
                      verticalAlign: '-2px',
                      marginRight: 4,
                    }}
                    aria-hidden="true"
                  >
                    smartphone
                  </span>
                  {r.modelo}
                </td>
                <td style={{ padding: 8, fontWeight: 600 }}>{fmtARS(r.impecable)}</td>
                {FALLAS.map(k => (
                  <td key={k} style={{ padding: 8, color: '#C0392B' }}>
                    -{fmtARS(r[k])}
                  </td>
                ))}
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => copiar(r)}
                    className="pe-btn pv-act"
                    aria-label={`Copiar precios de ${r.modelo}`}
                    title="Copiar"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 9px',
                      fontSize: 11,
                      fontWeight: 600,
                      background: '#5D6D7E',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 7,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 13 }}
                      aria-hidden="true"
                    >
                      content_copy
                    </span>
                    Copiar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
