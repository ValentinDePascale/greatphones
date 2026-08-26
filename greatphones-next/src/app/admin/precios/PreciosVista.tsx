'use client'

import { useMemo, useState } from 'react'
import { fmtARS } from '@/lib/precios'
import {
  copiarTexto,
  textoPlanoPrecio,
  textoWhatsAppPrecio,
  type PrecioItem,
} from '@/lib/precios-client'

const TIPOS_VISTA = ['cards', 'tabla', 'compacta'] as const
type Vista = (typeof TIPOS_VISTA)[number]
const VISTA_LABEL: Record<Vista, string> = { cards: 'Cards', tabla: 'Tabla', compacta: 'Compacta' }

const FILTROS = [
  'Todos',
  'iPhone 11',
  'iPhone 12',
  'iPhone 13',
  'iPhone 14',
  'iPhone 15',
  'iPhone 16',
  'iPhone 17',
]

interface Props {
  items: PrecioItem[]
  icono?: string
  dolarVenta?: number | null
  familiaFiltros?: string[]
}

export default function PreciosVista({
  items,
  icono = 'smartphone',
  dolarVenta = null,
  familiaFiltros,
}: Props) {
  const [buscar, setBuscar] = useState('')
  const [vista, setVista] = useState<Vista>('cards')
  const [filtro, setFiltro] = useState('Todos')
  const [ordenCampo, setOrdenCampo] = useState<keyof PrecioItem | null>(null)
  const [ordenDir, setOrdenDir] = useState<1 | -1>(1)
  const [toast, setToast] = useState<string | null>(null)

  const filtros = familiaFiltros || FILTROS

  const avisar = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const filtrados = useMemo(() => {
    let arr = items.filter(p => {
      if (filtro !== 'Todos') {
        const m = p.modelo || ''
        if (!(m === filtro || m.startsWith(filtro + ' '))) return false
      }
      if (buscar) {
        const texto = (p.modelo + ' ' + (p.almacenamiento || '')).toLowerCase()
        if (!texto.includes(buscar.toLowerCase())) return false
      }
      return true
    })
    if (ordenCampo) {
      const campo = ordenCampo,
        dir = ordenDir
      arr = arr.slice().sort((a, b) => {
        const va = a[campo],
          vb = b[campo]
        if (typeof va === 'string' && typeof vb === 'string') {
          return va.toLowerCase() < vb.toLowerCase()
            ? -dir
            : va.toLowerCase() > vb.toLowerCase()
              ? dir
              : 0
        }
        return ((Number(va) || 0) - (Number(vb) || 0)) * dir
      })
    }
    return arr
  }, [items, buscar, filtro, ordenCampo, ordenDir])

  const ordenarPor = (campo: keyof PrecioItem) => {
    if (ordenCampo === campo) setOrdenDir(ordenDir === 1 ? -1 : 1)
    else {
      setOrdenCampo(campo)
      setOrdenDir(1)
    }
  }

  const accionCopiar = async (idx: number) => {
    await copiarTexto(textoPlanoPrecio(filtrados[idx]))
    avisar('Precio copiado al portapapeles')
  }
  const accionWhatsapp = async (idx: number) => {
    await copiarTexto(textoWhatsAppPrecio(filtrados[idx]))
    avisar('Mensaje de WhatsApp copiado')
  }

  const cabeza = (label: string, campo?: keyof PrecioItem) => (
    <th
      scope="col"
      onClick={campo ? () => ordenarPor(campo) : undefined}
      aria-sort={
        campo && ordenCampo === campo ? (ordenDir === 1 ? 'ascending' : 'descending') : undefined
      }
      style={{
        position: 'sticky',
        top: 0,
        background: '#F4F6F9',
        padding: '8px',
        cursor: campo ? 'pointer' : 'default',
        userSelect: 'none',
        zIndex: 1,
        boxShadow: '0 1px 0 #E6E7F0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        {label}
        {campo && ordenCampo === campo && (
          <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden="true">
            {ordenDir === 1 ? 'arrow_upward' : 'arrow_downward'}
          </span>
        )}
      </span>
    </th>
  )

  const btnAccion: React.CSSProperties = {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: '7px 6px',
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  }

  return (
    <div>
      <style>{`
        .pv-search:focus-within { border-color: #FF6B2C !important; }
        .pv-search input:focus { outline: none; }
        .pv-chip:hover:not([aria-pressed="true"]) { background: #E8EBF2; }
        .pv-vistabtn:hover:not([aria-checked="true"]) { background: #F4F6F9; }
        .pv-act:hover { filter: brightness(.94); }
        @media (prefers-reduced-motion: reduce) {
          .pv-chip, .pv-vistabtn, .pv-act { transition: none !important; }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div
          className="pv-search"
          style={{
            flex: 1,
            maxWidth: 340,
            minWidth: 220,
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
        {dolarVenta ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#0F766E',
              fontWeight: 700,
              background: '#F0FDFA',
              border: '1px solid #CCFBF1',
              borderRadius: 99,
              padding: '6px 12px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">
              attach_money
            </span>
            Dólar venta: {fmtARS(dolarVenta)}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {filtros.map(f => (
          <button
            key={f}
            className="pv-chip"
            onClick={() => setFiltro(f)}
            aria-pressed={filtro === f}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 99,
              border: filtro === f ? '1px solid #FF6B2C' : '1px solid transparent',
              cursor: 'pointer',
              fontWeight: filtro === f ? 700 : 500,
              color: filtro === f ? '#fff' : '#334155',
              background: filtro === f ? '#FF6B2C' : '#EEF0F6',
              transition: 'background .15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 12.5 }}
      >
        <span style={{ fontWeight: 600, color: '#334155' }}>Vista:</span>
        <div
          role="radiogroup"
          aria-label="Tipo de vista"
          style={{
            display: 'inline-flex',
            background: '#FBFBFD',
            border: '1.5px solid #E6E7F0',
            borderRadius: 9,
            padding: 3,
            gap: 2,
          }}
        >
          {TIPOS_VISTA.map(v => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={vista === v}
              className="pv-vistabtn"
              onClick={() => setVista(v)}
              style={{
                border: 'none',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: vista === v ? 700 : 500,
                color: vista === v ? '#fff' : '#64748B',
                background: vista === v ? '#FF6B2C' : 'transparent',
                cursor: 'pointer',
                transition: 'background .15s',
              }}
            >
              {VISTA_LABEL[v]}
            </button>
          ))}
        </div>
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

      {vista === 'cards' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))',
            gap: 14,
          }}
        >
          {filtrados.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#8892A6', padding: 32 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 34, color: '#C3C9D6' }}
                aria-hidden="true"
              >
                search_off
              </span>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>Sin resultados para tu búsqueda.</p>
            </div>
          )}
          {filtrados.map((p, i) => (
            <div
              key={p.id}
              style={{
                background: '#fff',
                border: '1px solid #E6E7F0',
                borderRadius: 12,
                boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#181B2E',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 17, color: '#FF6B2C' }}
                  aria-hidden="true"
                >
                  {icono}
                </span>
                {p.modelo}
              </div>
              <div style={{ fontSize: 12, color: '#778799' }}>{p.almacenamiento || '—'}</div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  borderTop: '1px solid #EFF1F6',
                  paddingTop: 6,
                }}
              >
                <span>Venta:</span>
                <b>{fmtARS(p.precioARS)}</b>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  color: '#B7950B',
                }}
              >
                <span>Preventa:</span>
                <b>{fmtARS(p.preventaARS)}</b>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                  color: '#1E8449',
                }}
              >
                <span>Descuento:</span>
                <b>{fmtARS(p.descuentoARS)}</b>
              </div>
              {dolarVenta ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12.5,
                    color: '#556677',
                  }}
                >
                  <span>USD:</span>
                  <b>US${Math.round(p.precioARS / dolarVenta)}</b>
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  onClick={() => accionCopiar(i)}
                  className="pv-act"
                  style={{ ...btnAccion, background: '#5D6D7E' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14 }}
                    aria-hidden="true"
                  >
                    content_copy
                  </span>
                  Copiar
                </button>
                <button
                  onClick={() => accionWhatsapp(i)}
                  className="pv-act"
                  style={{ ...btnAccion, background: '#1E8449' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14 }}
                    aria-hidden="true"
                  >
                    chat
                  </span>
                  WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(vista === 'tabla' || vista === 'compacta') && (
        <div
          style={{
            overflow: 'auto',
            maxHeight: 'calc(100vh - 300px)',
            border: '1px solid #E6E7F0',
            borderRadius: 8,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: vista === 'tabla' ? 12.5 : 12,
            }}
          >
            <colgroup>
              <col style={{ width: '26%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                {cabeza('Modelo', 'modelo')}
                {cabeza(vista === 'tabla' ? 'Almac.' : 'GB', 'almacenamiento')}
                {cabeza('Venta', 'precioARS')}
                {cabeza('Prev', 'preventaARS')}
                {cabeza('Desc', 'descuentoARS')}
                {dolarVenta ? cabeza('USD') : null}
                <th
                  scope="col"
                  style={{
                    position: 'sticky',
                    top: 0,
                    background: '#F4F6F9',
                    padding: '8px',
                    zIndex: 1,
                    boxShadow: '0 1px 0 #E6E7F0',
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 28, color: '#8892A6' }}>
                    Sin resultados para tu búsqueda.
                  </td>
                </tr>
              )}
              {filtrados.map((p, i) => (
                <tr key={p.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                  <td
                    style={{
                      padding: '6px 8px',
                      fontWeight: 600,
                      color: '#181B2E',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
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
                      {icono}
                    </span>
                    {p.modelo}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', color: '#778799' }}>
                    {p.almacenamiento || '—'}
                  </td>
                  <td style={{ padding: '6px 8px' }}>{fmtARS(p.precioARS)}</td>
                  <td style={{ padding: '6px 8px', color: '#B7950B' }}>{fmtARS(p.preventaARS)}</td>
                  <td style={{ padding: '6px 8px', color: '#1E8449' }}>{fmtARS(p.descuentoARS)}</td>
                  {dolarVenta ? (
                    <td style={{ padding: '6px 8px', color: '#556677' }}>
                      US${Math.round(p.precioARS / dolarVenta)}
                    </td>
                  ) : null}
                  <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => accionCopiar(i)}
                      className="pv-act"
                      aria-label={`Copiar precio de ${p.modelo}`}
                      title="Copiar"
                      style={{
                        marginRight: 4,
                        padding: '5px 7px',
                        background: '#5D6D7E',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        verticalAlign: 'middle',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14, display: 'block' }}
                        aria-hidden="true"
                      >
                        content_copy
                      </span>
                    </button>
                    <button
                      onClick={() => accionWhatsapp(i)}
                      className="pv-act"
                      aria-label={`Copiar mensaje de WhatsApp de ${p.modelo}`}
                      title="WhatsApp"
                      style={{
                        padding: '5px 7px',
                        background: '#1E8449',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        verticalAlign: 'middle',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14, display: 'block' }}
                        aria-hidden="true"
                      >
                        chat
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
