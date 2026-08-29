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

interface ColorVariant {
  color: string
  precio: number
  fecha: string
}

interface PreventaSeleccionada {
  id: string
  productId: string
  modelo: string
  color: string
  precio: number
  fecha: string
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
  const [ediciones, setEdiciones] = useState<Map<string, ColorVariant[]>>(new Map())
  const [fechaGlobal, setFechaGlobal] = useState(enDias(30))
  const [expandido, setExpandido] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)
  const [codigos, setCodigos] = useState<string[]>([])

  useEffect(() => {
    let activo = true
    fetch('/api/admin/precios', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (!activo) return
        const items = Array.isArray(d) ? d.filter((p: PriceListItem) => p.active) : []
        setProductos(items)
      })
      .catch(err => {
        if (activo) setMensaje({ tipo: 'error', texto: 'Error al cargar la lista de precios' })
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const coloresDisponibles = (producto: PriceListItem) => {
    if (producto.colors && Array.isArray(producto.colors)) return producto.colors
    return ['Estándar']
  }

  const handleToggleProducto = (productId: string) => {
    if (expandido === productId) {
      setExpandido(null)
    } else {
      setExpandido(productId)
      if (!ediciones.has(productId)) {
        const colores = coloresDisponibles(
          productos.find(p => p.id === productId)!,
        ).map(color => ({
          color,
          precio: productos.find(p => p.id === productId)?.preventaARS || 0,
          fecha: fechaGlobal,
        }))
        const newEdiciones = new Map(ediciones)
        newEdiciones.set(productId, colores)
        setEdiciones(newEdiciones)
      }
    }
  }

  const handlePrecioColor = (productId: string, color: string, nuevoPrecio: number) => {
    const newEdiciones = new Map(ediciones)
    const colores = newEdiciones.get(productId) || []
    const idx = colores.findIndex(c => c.color === color)
    if (idx >= 0) {
      colores[idx].precio = nuevoPrecio
      newEdiciones.set(productId, colores)
      setEdiciones(newEdiciones)
    }
  }

  const handleFechaColor = (productId: string, color: string, nuevaFecha: string) => {
    const newEdiciones = new Map(ediciones)
    const colores = newEdiciones.get(productId) || []
    const idx = colores.findIndex(c => c.color === color)
    if (idx >= 0) {
      colores[idx].fecha = nuevaFecha
      newEdiciones.set(productId, colores)
      setEdiciones(newEdiciones)
    }
  }

  const handleFechaGlobalChange = (nuevaFecha: string) => {
    setFechaGlobal(nuevaFecha)
    const newEdiciones = new Map(ediciones)
    newEdiciones.forEach((colores, productId) => {
      colores.forEach(c => {
        c.fecha = nuevaFecha
      })
    })
    setEdiciones(newEdiciones)
  }

  const obtenerPreventasSeleccionadas = (): PreventaSeleccionada[] => {
    const preventas: PreventaSeleccionada[] = []
    let id = 0
    Array.from(ediciones.entries()).forEach(([productId, colores]) => {
      const prod = productos.find(p => p.id === productId)
      colores.forEach(({ color, precio, fecha }) => {
        preventas.push({
          id: `temp-${id++}`,
          productId,
          modelo: prod?.modelo || '',
          color,
          precio,
          fecha,
        })
      })
    })
    return preventas
  }

  const preventasSeleccionadas = obtenerPreventasSeleccionadas()

  const handleBorrarPreventa = (preventaId: string) => {
    const [productId, colorName] = preventaId.split('::')
    const newEdiciones = new Map(ediciones)
    const colores = newEdiciones.get(productId) || []
    const idx = colores.findIndex(c => c.color === colorName)
    if (idx >= 0) {
      colores.splice(idx, 1)
      if (colores.length === 0) {
        newEdiciones.delete(productId)
      } else {
        newEdiciones.set(productId, colores)
      }
      setEdiciones(newEdiciones)
    }
  }

  const handleCrearPreventas = async () => {
    if (preventasSeleccionadas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Selecciona al menos un color de algún producto' })
      return
    }

    setEnviando(true)
    setMensaje(null)

    const preventas = preventasSeleccionadas.map(p => ({
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
        setMensaje({ tipo: 'error', texto: data.error || 'Error al crear las preventas' })
        return
      }

      setCodigos(data.codigos || [])
      setEdiciones(new Map())
      setExpandido(null)
      setMensaje({ tipo: 'success', texto: `${data.codigos?.length || 0} preventas creadas exitosamente` })
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setEnviando(false)
    }
  }

  if (codigos.length > 0) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <AdminTopbar titulo="Preventas creadas" />
        <div
          style={{
            background: '#fff',
            border: '1px solid #E6E7F0',
            borderRadius: 14,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 56, color: '#0F9D58', display: 'block' }}
            aria-hidden="true"
          >
            check_circle
          </span>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#181B2E', margin: '12px 0 8px' }}>
            {codigos.length} preventas online creadas
          </h2>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>
            Códigos generados:
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
              marginBottom: 24,
            }}
          >
            {codigos.map(codigo => (
              <div
                key={codigo}
                style={{
                  background: '#F0FDFA',
                  border: '1px solid #ABEBC6',
                  borderRadius: 10,
                  padding: 12,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0F766E',
                }}
              >
                {codigo}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setCodigos([])
              setMensaje(null)
            }}
            style={{
              background: 'linear-gradient(135deg,#FF6B2C,#FF8A50)',
              color: '#fff',
              padding: '11px 28px',
              border: 'none',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Crear más preventas
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <AdminTopbar titulo="Preventa Online (Lotes)" />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* Panel lateral */}
        <div
          style={{
            width: 300,
            background: '#FAFBFD',
            borderRight: '1px solid #E6E7F0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid #E6E7F0' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#181B2E', margin: '0 0 8px' }}>
              Preventas seleccionadas
            </h3>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FF6B2C', margin: 0 }}>
              {preventasSeleccionadas.length}
            </p>
          </div>

          {preventasSeleccionadas.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                Selecciona colores de productos para crear preventas
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
              {preventasSeleccionadas.map(preventa => {
                const prod = productos.find(p => p.id === preventa.productId)
                const preventaKey = `${preventa.productId}::${preventa.color}`
                return (
                  <div
                    key={preventaKey}
                    style={{
                      background: '#fff',
                      border: '1px solid #E6E7F0',
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 8,
                      fontSize: 11,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#181B2E', marginBottom: 4 }}>
                      {preventa.modelo}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>
                      {preventa.color}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ color: '#FF6B2C', fontWeight: 600 }}>
                        {fmt(preventa.precio)}
                      </span>
                      <span style={{ color: '#6B7280', fontSize: 9 }}>
                        {new Date(preventa.fecha).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleBorrarPreventa(preventaKey)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: 6,
                        fontSize: 10,
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
                      Borrar
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: 24, maxWidth: 1000 }}>
            <style>{`
              .prod-card { transition: all .15s; cursor: pointer; }
              .prod-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1); }
              .prod-card.expanded { border-color: #FF6B2C; }
              .color-input { font-size: 12px; padding: 8px; }
              .color-input:focus { border-color: #FF6B2C !important; outline: none; }
              .btn-primary { background: linear-gradient(135deg,#FF6B2C,#FF8A50); color: #fff; }
              .btn-primary:disabled { background: #FFB48C; cursor: wait; }
              .btn-primary:hover:not(:disabled) { filter: brightness(.94); }
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

            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>
              Selecciona dispositivos de Lista de Precios para crear preventas online
            </p>

            <div
              style={{
                background: '#fff',
                border: '1px solid #E6E7F0',
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-end',
              }}
            >
              <div>
                <label
                  htmlFor="fecha-global"
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#3D4356',
                    marginBottom: 5,
                  }}
                >
                  Fecha disponible global
                </label>
                <input
                  id="fecha-global"
                  type="date"
                  value={fechaGlobal}
                  onChange={e => handleFechaGlobalChange(e.target.value)}
                  style={{ ...inputStyle, width: 180 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                  Por defecto: +30 días. Se aplica a todos los productos.
                </p>
              </div>
            </div>

            {cargando ? (
              <p style={{ textAlign: 'center', color: '#8892A6', padding: 32 }}>
                Cargando lista de precios…
              </p>
            ) : productos.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#8892A6', padding: 32 }}>
                No hay productos en Lista de Precios
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 14,
                }}
              >
                {productos.map(prod => {
                  const edicion = ediciones.get(prod.id)
                  const colores = coloresDisponibles(prod)
                  const isExpanded = expandido === prod.id

                  return (
                    <div
                      key={prod.id}
                      className={`prod-card ${isExpanded ? 'expanded' : ''}`}
                      style={{
                        background: '#fff',
                        border: `2px solid ${isExpanded ? '#FF6B2C' : '#E6E7F0'}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        onClick={() => handleToggleProducto(prod.id)}
                        style={{
                          padding: 12,
                          borderBottom: isExpanded ? '1px solid #E6E7F0' : 'none',
                          display: 'flex',
                          gap: 12,
                          alignItems: 'start',
                        }}
                      >
                        {prod.imageUrl && (
                          <img
                            src={prod.imageUrl}
                            alt={prod.modelo}
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 8,
                              background: '#FAFBFD',
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#181B2E' }}>
                            {prod.modelo}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                            {prod.almacenamiento}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#FF6B2C', marginTop: 4 }}>
                            {fmt(prod.preventaARS)}
                          </div>
                        </div>
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 20,
                            color: '#94A3B8',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform .15s',
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        >
                          expand_more
                        </span>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: 12, background: '#FAFBFD' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8 }}>
                            COLORES
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {colores.map(color => {
                              const colorData = edicion?.find(c => c.color === color) || {
                                color,
                                precio: prod.preventaARS,
                                fecha: fechaGlobal,
                              }
                              return (
                                <div key={color} style={{ borderTop: '1px solid #E6E7F0', paddingTop: 10 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#181B2E', marginBottom: 6 }}>
                                    {color}
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <div>
                                      <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 3 }}>
                                        Precio
                                      </label>
                                      <input
                                        type="number"
                                        className="color-input"
                                        value={colorData.precio}
                                        onChange={e =>
                                          handlePrecioColor(prod.id, color, parseInt(e.target.value) || 0)
                                        }
                                        style={{ ...inputStyle, padding: 8, fontSize: 12 }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 3 }}>
                                        Fecha
                                      </label>
                                      <input
                                        type="date"
                                        className="color-input"
                                        value={colorData.fecha}
                                        onChange={e => handleFechaColor(prod.id, color, e.target.value)}
                                        style={{ ...inputStyle, padding: 8, fontSize: 12 }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer con botón */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E6E7F0',
              borderTop: '1px solid #E6E7F0',
              padding: 16,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 'auto',
            }}
          >
            <button
              className="btn-primary"
              onClick={handleCrearPreventas}
              disabled={enviando || preventasSeleccionadas.length === 0}
              style={{
                padding: '12px 32px',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: enviando ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {enviando ? (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}
                    aria-hidden="true"
                  >
                    progress_activity
                  </span>
                  Creando…
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18 }}
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                  Crear {preventasSeleccionadas.length} preventa{preventasSeleccionadas.length === 1 ? '' : 's'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
