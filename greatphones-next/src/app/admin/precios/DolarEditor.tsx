'use client'

import { useEffect, useState } from 'react'
import type { DolarData } from './dolar'
import { fetchDolar } from './dolar'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E6E7F0',
  borderRadius: 8,
  fontSize: 13,
  background: '#FBFBFD',
  color: '#181B2E',
  transition: 'border-color .15s',
  fontFamily: 'monospace',
}

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: '#FF6B2C',
  outline: 'none',
}

export default function DolarEditor() {
  const [dolarData, setDolarData] = useState<DolarData | null>(null)
  const [compra, setCompra] = useState('')
  const [venta, setVenta] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandida, setExpandida] = useState(false)

  useEffect(() => {
    fetchDolar('blue').then(d => {
      if (d) {
        setDolarData(d)
        setCompra(d.compra.toString())
        setVenta(d.venta.toString())
      }
    })
  }, [])

  const handleSave = async () => {
    const ventaNum = parseFloat(venta)
    const compraNum = parseFloat(compra)

    if (!ventaNum || ventaNum <= 0) {
      setMessage({ type: 'error', text: 'Dólar de venta debe ser > 0' })
      return
    }
    if (!compraNum || compraNum <= 0) {
      setMessage({ type: 'error', text: 'Dólar de compra debe ser > 0' })
      return
    }

    setSaving(true)
    try {
      const r = await fetch('/api/admin/precios/dolar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ venta: ventaNum, compra: compraNum }),
      })
      if (!r.ok) {
        const err = await r.json()
        setMessage({ type: 'error', text: err.error || 'Error al guardar' })
      } else {
        setDolarData({ venta: ventaNum, compra: compraNum, fecha: new Date().toISOString(), fuente: 'manual' })
        setMessage({ type: 'success', text: 'Cotización guardada' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error de conexión' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar el override y volver a usar dolarapi?')) return
    setSaving(true)
    try {
      const r = await fetch('/api/admin/precios/dolar', { method: 'DELETE', credentials: 'include' })
      if (!r.ok) {
        setMessage({ type: 'error', text: 'Error al eliminar override' })
      } else {
        setDolarData(null)
        setCompra('')
        setVenta('')
        setMessage({ type: 'success', text: 'Override eliminado' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error de conexión' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        marginBottom: 24,
      }}
    >
      <button
        onClick={() => setExpandida(!expandida)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: '#FF6B2C',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {expandida ? 'expand_less' : 'expand_more'}
        </span>
        Cotización del dólar
      </button>

      {expandida && (
        <div style={{ marginTop: 16 }}>
          {dolarData && (
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
              Fuente: <strong>{dolarData.fuente}</strong>
              {dolarData.fecha && ` · ${new Date(dolarData.fecha).toLocaleString('es-AR')}`}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 6 }}>
                Dólar compra (lo que pagás)
              </label>
              <input
                type="number"
                step="0.01"
                value={compra}
                onChange={e => setCompra(e.target.value)}
                disabled={saving}
                onFocus={e => (e.currentTarget.style.borderColor = '#FF6B2C')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E6E7F0')}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D4356', marginBottom: 6 }}>
                Dólar venta (lo que vendés)
              </label>
              <input
                type="number"
                step="0.01"
                value={venta}
                onChange={e => setVenta(e.target.value)}
                disabled={saving}
                onFocus={e => (e.currentTarget.style.borderColor = '#FF6B2C')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E6E7F0')}
                style={inputStyle}
              />
            </div>
          </div>

          {message && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 12,
                background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                color: message.type === 'success' ? '#065F46' : '#7F1D1D',
                border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: '#FF6B2C',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Guardando…' : 'Guardar cotización'}
            </button>
            {dolarData?.fuente === 'manual' && (
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{
                  padding: '10px 12px',
                  background: '#fff',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                Eliminar override
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
