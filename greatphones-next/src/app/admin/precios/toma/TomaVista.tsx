'use client'

import { useCallback, useEffect, useState } from 'react'
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

const inputStyle = { width: '100%', padding: 9, border: '1.5px solid #E6E7F0', borderRadius: 9, fontSize: 13, background: '#FBFBFD' }

const FALLAS: Array<'bateria' | 'pantalla' | 'camara' | 'microfono' | 'parlante' | 'tapa' | 'marco' | 'pin'> = [
  'bateria', 'pantalla', 'camara', 'microfono', 'parlante', 'tapa', 'marco', 'pin',
]
const FALLA_LABEL: Record<string, string> = {
  bateria: 'Bat', pantalla: 'Pant', camara: 'Cam', microfono: 'Mic',
  parlante: 'Parl', tapa: 'Tapa', marco: 'Marco', pin: 'Pin',
}

export default function TomaVista() {
  const [rows, setRows] = useState<TomaRow[]>([])
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/precios/toma', { credentials: 'include' })
      const d = await r.json()
      setRows(Array.isArray(d) ? d : [])
    } catch { setError('No se pudieron cargar los precios de toma') }
  }, [])
  useEffect(() => { load() }, [load])

  const filtrados = rows.filter(r => !buscar || (r.modelo || '').toLowerCase().includes(buscar.toLowerCase()))

  const copiar = (r: TomaRow) => {
    const texto = `📱 ${r.modelo}\n` +
      `Impecable: ${fmtARS(r.impecable)}\n` +
      FALLAS.map((k) => `Falta ${FALLA_LABEL[k]}: -${fmtARS(r[k])}`).join('\n')
    copiarTexto(texto)
  }

  return (
    <div>
      {error && <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, color: '#fff', fontWeight: 600, fontSize: 13, background: '#DC2626' }}>{error}</div>}
      <input style={{ ...inputStyle, maxWidth: 340, marginBottom: 14 }} placeholder="🔎 Buscar modelo..." value={buscar} onChange={e => setBuscar(e.target.value)} />
      <div style={{ overflowX: 'auto', border: '1px solid #E6E7F0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: '#F4F6F9', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Modelo</th>
              <th style={{ padding: 8 }}>Impecable</th>
              {FALLAS.map((k) => <th key={k} style={{ padding: 8 }}>{FALLA_LABEL[k]}</th>)}
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && <tr><td colSpan={11} style={{ padding: 20, textAlign: 'center', color: '#889' }}>Sin resultados.</td></tr>}
            {filtrados.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid #E6E7F0' }}>
                <td style={{ padding: 8, fontWeight: 600, color: '#4F46E5' }}>📱 {r.modelo}</td>
                <td style={{ padding: 8, fontWeight: 600 }}>{fmtARS(r.impecable)}</td>
                {FALLAS.map((k) => <td key={k} style={{ padding: 8, color: '#C0392B' }}>-{fmtARS(r[k])}</td>)}
                <td style={{ padding: 8 }}>
                  <button onClick={() => copiar(r)} style={{ padding: '6px 8px', fontSize: 10.5, background: '#5D6D7E', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>📋 Copiar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
