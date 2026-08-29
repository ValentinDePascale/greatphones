'use client'

import { useEffect, useState } from 'react'
import AdminTopbar from '@/components/AdminTopbar'

interface PriceListItem {
  id: string
  modelo: string
  almacenamiento: string
  preventaARS: number
  imageUrl?: string
  colors?: string[]
  active: boolean
}

interface PreventaAgregada {
  id: string
  productId: string
  modelo: string
  almacenamiento: string
  color: string
  precio: number
  fecha: string
  imageUrl?: string
}

function fmt(n: number) {
  return '$' + (n || 0).toLocaleString('es-AR')
}

function enDias(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
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

export default function PreventaOnlineClient() {
  const [productos, setProductos] = useState<PriceListItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [preventasAgregadas, setPreventasAgregadas] = useState<PreventaAgregada[]>([])
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [fechaGlobal, setFechaGlobal] = useState(enDias(30))
  const [modalProducto, setModalProducto] = useState<PriceListItem | null>(null)
  const [modalColoresSeleccionados, setModalColoresSeleccionados] = useState<Set<string>>(new Set())
  const [modalPrecio, setModalPrecio] = useState('')
  const [modalFecha, setModalFecha] = useState('')

  useEffect(() => {
    let activo = true
    fetch('/api/admin/precios', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (!activo) return
        const items = Array.isArray(d) ? d.filter((p: PriceListItem) => p.active) : []
        setProductos(items)
      })
      .catch(() => {
        if (activo) setMensaje({ tipo: 'error', texto: 'Error al cargar productos' })
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const coloresDisponibles = (producto: PriceListItem) => {
    return producto.colors?.length ? producto.colors : ['Estándar']
  }

  const handleAbrirModal = (producto: PriceListItem) => {
    setModalProducto(producto)
    setModalColoresSeleccionados(new Set(coloresDisponibles(producto)))
    setModalPrecio(String(producto.preventaARS))
    setModalFecha(fechaGlobal)
  }

  const handleAgregarColor = () => {
    if (!modalProducto || modalColoresSeleccionados.size === 0) return

    const nuevas: PreventaAgregada[] = []
    modalColoresSeleccionados.forEach(color => {
      const id = `${Date.now()}-${Math.random()}`
      nuevas.push({
        id,
        productId: modalProducto.id,
        modelo: modalProducto.modelo,
        almacenamiento: modalProducto.almacenamiento,
        color,
        precio: parseInt(modalPrecio) || 0,
        fecha: modalFecha,
        imageUrl: modalProducto.imageUrl,
      })
    })

    setPreventasAgregadas([...preventasAgregadas, ...nuevas])
    setModalProducto(null)
    setMensaje({
      tipo: 'success',
      texto: `${nuevas.length} color${nuevas.length > 1 ? 'es' : ''} agregado${nuevas.length > 1 ? 's' : ''} a la lista`
    })
  }

  const handleEliminarPreventa = (id: string) => {
    setPreventasAgregadas(preventasAgregadas.filter(p => p.id !== id))
  }

  const handleEditarPreventa = (id: string, precio: number, fecha: string) => {
    setPreventasAgregadas(
      preventasAgregadas.map(p => (p.id === id ? { ...p, precio, fecha } : p)),
    )
  }

  const handleCrearPreventas = async () => {
    if (preventasAgregadas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un dispositivo' })
      return
    }

    setEnviando(true)
    setMensaje(null)

    const preventas = preventasAgregadas.map(p => ({
      productId: p.productId,
      productColor: p.color,
      customPrice: p.precio,
      expectedDeliveryEnd: p.fecha,
    }))

    try {
      const response = await fetch('/api/admin/preorders/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preventas }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al crear' })
        return
      }

      setMensaje({
        tipo: 'success',
        texto: data.message || `${data.total || 0} producto${data.total !== 1 ? 's' : ''} de preventa agregado${data.total !== 1 ? 's' : ''}`,
      })
      setPreventasAgregadas([])
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <AdminTopbar titulo="Preventa Online" />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Contenido principal */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto', maxWidth: 1200 }}>
          <style>{`
            .prod-card { transition: all .15s; }
            .prod-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1); }
            .btn-primary { background: linear-gradient(135deg,#FF6B2C,#FF8A50); color: #fff; }
            .btn-primary:disabled { background: #FFB48C; cursor: wait; }
            .btn-primary:hover:not(:disabled) { filter: brightness(.94); }
            .btn-secondary { background: #fff; border: 1.5px solid #E6E7F0; color: #181B2E; }
            .btn-secondary:hover { border-color: #FF6B2C; color: #FF6B2C; }
          `}</style>

          {mensaje && (
            <div
              style={{
                background: mensaje.tipo === 'error' ? '#FEF2F2' : '#D5F5E3',
                border: `1px solid ${mensaje.tipo === 'error' ? '#FECACA' : '#ABEBC6'}`,
                color: mensaje.tipo === 'error' ? '#991B1B' : '#166534',
                padding: '12px 14px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {mensaje.texto}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#181B2E', margin: '0 0 8px' }}>
              Dispositivos disponibles
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              Haz clic en "Agregar" para seleccionar colores y precio
            </p>
          </div>

          {cargando ? (
            <p style={{ textAlign: 'center', color: '#8892A6', padding: 32 }}>
              Cargando productos…
            </p>
          ) : productos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8892A6', padding: 32 }}>
              No hay productos en Lista de Precios
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              {productos.map(prod => (
                <div
                  key={prod.id}
                  className="prod-card"
                  style={{
                    background: '#fff',
                    border: '1px solid #E6E7F0',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  {prod.imageUrl && (
                    <img
                      src={prod.imageUrl}
                      alt={prod.modelo}
                      style={{
                        width: '100%',
                        height: 130,
                        objectFit: 'cover',
                        background: '#FAFBFD',
                      }}
                    />
                  )}
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#181B2E' }}>
                      {prod.modelo}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2, lineHeight: 1.3 }}>
                      {prod.almacenamiento}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FF6B2C', marginTop: 4 }}>
                      {fmt(prod.preventaARS)}
                    </div>
                    <button
                      onClick={() => handleAbrirModal(prod)}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        marginTop: 8,
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral derecho */}
        <div
          style={{
            width: 350,
            background: '#FAFBFD',
            borderLeft: '1px solid #E6E7F0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid #E6E7F0' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#181B2E', margin: '0 0 2px' }}>
              Preventas agregadas
            </h3>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FF6B2C', margin: 0 }}>
              {preventasAgregadas.length}
            </p>
          </div>

          {/* Fecha global */}
          <div style={{ padding: 12, borderBottom: '1px solid #E6E7F0' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>
              Fecha disponible
            </label>
            <input
              type="date"
              value={fechaGlobal}
              onChange={e => {
                setFechaGlobal(e.target.value)
                setModalFecha(e.target.value)
              }}
              style={{ ...inputStyle, fontSize: 12, padding: 8 }}
            />
          </div>

          {/* Lista de preventas */}
          {preventasAgregadas.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                Agrega dispositivos desde la izquierda
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
              {preventasAgregadas.map(preventa => (
                <div
                  key={preventa.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #E6E7F0',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#181B2E', marginBottom: 6 }}>
                    {preventa.modelo} · {preventa.color}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 9, color: '#6B7280', display: 'block', marginBottom: 2 }}>
                        Precio
                      </label>
                      <input
                        type="number"
                        value={preventa.precio}
                        onChange={e =>
                          handleEditarPreventa(preventa.id, parseInt(e.target.value) || 0, preventa.fecha)
                        }
                        style={{ ...inputStyle, fontSize: 11, padding: 6 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: '#6B7280', display: 'block', marginBottom: 2 }}>
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={preventa.fecha}
                        onChange={e =>
                          handleEditarPreventa(preventa.id, preventa.precio, e.target.value)
                        }
                        style={{ ...inputStyle, fontSize: 11, padding: 6 }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleEliminarPreventa(preventa.id)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#DC2626'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#FEF2F2'
                      e.currentTarget.style.color = '#DC2626'
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botón crear */}
          <div style={{ padding: 12, borderTop: '1px solid #E6E7F0' }}>
            <button
              onClick={handleCrearPreventas}
              disabled={enviando || preventasAgregadas.length === 0}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: enviando ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {enviando ? (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                  >
                    progress_activity
                  </span>
                  Creando…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    cloud_upload
                  </span>
                  Agregar a página
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal de selección de color */}
        {modalProducto && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setModalProducto(null)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 24,
                maxWidth: 400,
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,.3)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#181B2E', margin: '0 0 12px' }}>
                {modalProducto.modelo}
              </h3>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#3D4356', display: 'block', marginBottom: 8 }}>
                  Colores
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {coloresDisponibles(modalProducto).map(color => (
                    <label
                      key={color}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: '#181B2E',
                        cursor: 'pointer',
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: modalColoresSeleccionados.has(color) ? '#F0F4FF' : 'transparent',
                        transition: 'background .15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={modalColoresSeleccionados.has(color)}
                        onChange={e => {
                          const nuevos = new Set(modalColoresSeleccionados)
                          if (e.target.checked) {
                            nuevos.add(color)
                          } else {
                            nuevos.delete(color)
                          }
                          setModalColoresSeleccionados(nuevos)
                        }}
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                      {color}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#3D4356', display: 'block', marginBottom: 6 }}>
                  Precio
                </label>
                <input
                  type="number"
                  value={modalPrecio}
                  onChange={e => setModalPrecio(e.target.value)}
                  style={{ ...inputStyle }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#3D4356', display: 'block', marginBottom: 6 }}>
                  Fecha disponible
                </label>
                <input
                  type="date"
                  value={modalFecha}
                  onChange={e => setModalFecha(e.target.value)}
                  style={{ ...inputStyle }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setModalProducto(null)}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: '1.5px solid #E6E7F0',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarColor}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
