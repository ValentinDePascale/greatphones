'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface Tab {
  href: string
  legacy?: string
  label: string
  icon: string
  exact?: boolean
}

interface SubGroup {
  title: string
  items: Tab[]
}

interface NavGroup {
  title: string
  color: string
  groups: SubGroup[]
}

// Items con `legacy` apuntan a rutas reales cuyo tab se activa en el shell
// SPA persistente (AdminTabActivator). El resto son secciones React nuevas.
const operaciones: SubGroup = {
  title: '',
  items: [
    { href: '/admin/ops/compras', label: 'Registrar Compra', icon: 'shopping_cart' },
    { href: '/admin/ops/ventas', label: 'Registrar Venta', icon: 'payments' },
    { href: '/admin/ops/preventas', label: 'Registrar Preventa', icon: 'event' },
    { href: '/admin/ops/entregar-preventa', label: 'Entregar Preventa', icon: 'package_2' },
  ],
}

const precios: SubGroup = {
  title: '',
  items: [
    { href: '/admin/precios', label: 'Lista de Precios', icon: 'price_change', exact: true },
    { href: '/admin/precios/mac-ipad', label: 'Mac / iPad', icon: 'laptop_mac' },
    { href: '/admin/precios/toma', label: 'Precios de Toma', icon: 'swap_horiz' },
    { href: '/admin/precios/calculadora-toma', label: 'Calculadora de Toma', icon: 'calculate' },
    { href: '/admin/precios/calculadora-cuotas', label: 'Calculadora de Cuotas', icon: 'credit_card' },
  ],
}

const taller: SubGroup = {
  title: '',
  items: [
    { href: '/admin/taller/reparaciones', label: 'Registrar Reparación', icon: 'handyman' },
    { href: '/admin/taller/tarifario', label: 'Tarifario Reparaciones', icon: 'price_check' },
    { href: '/admin/taller/gastos', label: 'Registrar Gasto', icon: 'payments' },
  ],
}

const analisis: SubGroup = {
  title: '',
  items: [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true, legacy: 'dashboard' },
    { href: '/admin/analisis/reportes', label: 'Reportes', icon: 'monitoring' },
  ],
}

const inventario: SubGroup = {
  title: '',
  items: [
    { href: '/admin/productos', label: 'Productos', icon: 'smartphone', legacy: 'prods' },
    { href: '/admin/accesorios', label: 'Accesorios', icon: 'headphones', legacy: 'acc' },
    { href: '/admin/stock', label: 'Stock', icon: 'inventory_2', legacy: 'stock' },
    { href: '/admin/promos', label: 'Promociones', icon: 'local_offer', legacy: 'promos' },
  ],
}

const gestion: SubGroup[] = [
  {
    title: 'ERP',
    items: [
      { href: '/admin/gestion/mis-operaciones', label: 'Mis Operaciones', icon: 'folder_managed', exact: true },
      { href: '/admin/gestion/comisiones', label: 'Comisiones', icon: 'payments', exact: true },
      { href: '/admin/auditoria', label: 'Auditoría', icon: 'fact_check' },
    ],
  },
  {
    title: 'Comercio online',
    items: [
      { href: '/admin/ventas', label: 'Historial de Ventas', icon: 'receipt_long', legacy: 'sales' },
      { href: '/admin/preventa', label: 'Preventa Online', icon: 'calendar_month', legacy: 'preventa' },
      { href: '/admin/pedidos', label: 'Pedidos', icon: 'shopping_bag', legacy: 'orders' },
      { href: '/admin/cupones', label: 'Cupones', icon: 'confirmation_number', legacy: 'cupones' },
      { href: '/admin/arrepentimientos', label: 'Arrepentimientos', icon: 'undo', legacy: 'arrep' },
    ],
  },
  {
    title: 'Cotizaciones',
    items: [
      { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: 'request_quote', legacy: 'quotes' },
      { href: '/admin/comprados', label: 'Cotizaciones Dashboard', icon: 'space_dashboard' },
    ],
  },
  {
    title: 'Comunicación y plataforma',
    items: [
      { href: '/admin/chat', label: 'Chat', icon: 'chat', legacy: 'chat' },
      { href: '/admin/inversores', label: 'Inversores', icon: 'savings' },
      { href: '/admin/usuarios', label: 'Usuarios', icon: 'group', legacy: 'users' },
    ],
  },
]

const GROUPS: NavGroup[] = [
  { title: 'Operaciones', color: '#b45309', groups: [operaciones] },
  { title: 'Precios', color: '#0d9488', groups: [precios] },
  { title: 'Taller y Gastos', color: '#b91c1c', groups: [taller] },
  { title: 'Análisis', color: '#7c3aed', groups: [analisis] },
  { title: 'Inventario Online', color: '#0f766e', groups: [inventario] },
  { title: 'Gestión', color: '#94a3b8', groups: gestion },
]

interface Props {
  open: boolean
  onToggle: () => void
}

function SidebarLink({ t, active, pathname, onToggle }: { t: Tab; active: boolean; pathname: string; onToggle: () => void }) {
  const router = useRouter()
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 10, marginBottom: 2, textDecoration: 'none',
    color: active ? '#FF6B2C' : '#64748b',
    background: active ? 'rgba(255,107,44,.08)' : 'transparent',
    fontSize: 13, fontWeight: active ? 600 : 500,
    transition: 'all .15s', cursor: 'pointer',
    width: '100%', textAlign: 'left', border: 'none',
  }
  const icon = <span className="material-symbols-outlined" style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">{t.icon}</span>

  // Sección legacy: renderiza el tab en el shell persistente llamando directo
  // a window.renderAdminContent (sin eventos intermedios, inmune a HMR/remount).
  // Solo navega si no está ya en esa ruta (router.push a misma URL causaba
  // race que dejaba el tab vacío).
  if (t.legacy) {
    const already = pathname === t.href
    return (
      <button
        aria-label={t.label}
        style={style}
        onClick={() => {
          const w = window as any
          if (typeof w.renderAdminContent === 'function') {
            w.renderAdminContent(t.legacy)
          } else {
            w.dispatchEvent?.(new CustomEvent('admin:nav', { detail: t.legacy }))
          }
          if (!already) router.push(t.href)
          onToggle()
        }}
        aria-current={active ? 'page' : undefined}
      >
        {icon}{t.label}
      </button>
    )
  }

  // Sección React: Link con prefetch.
  return (
    <Link href={t.href} onClick={onToggle} style={style} prefetch>
      {icon}{t.label}
    </Link>
  )
}

export default function AdminSidebar({ open, onToggle }: Props) {
  const pathname = usePathname()
  const [query, setQuery] = useState('')

  const activeFor = (t: Tab) => {
    if (t.exact) return pathname === t.href
    return pathname.startsWith(t.href)
  }

  const q = query.trim().toLowerCase()
  const filtering = q.length > 0

  return (
    <>
      {open && (
        <div
          onClick={onToggle}
          className="admin-sidebar-scrim"
          style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(15,23,42,.45)' }}
        />
      )}
      <aside
        className={`admin-sidebar ${open ? 'admin-sidebar-open' : ''}`}
        style={{
          width: 240, minHeight: '100vh', background: '#ffffff', color: '#0f172a',
          padding: '1rem 0', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 1rem 1.5rem', borderBottom: '1px solid #e5e7eb', marginBottom: '.5rem' }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: '#FF6B2C', fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>
            Great Phones
          </Link>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, letterSpacing: '.5px', textTransform: 'uppercase' }}>
            Panel de administración
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 .5rem', overflow: 'auto' }}>
          <div style={{ padding: '0 8px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F4F6F9', border: '1px solid #E6E7F0', borderRadius: 9, padding: '7px 10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1 }} aria-hidden="true">search</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar sección..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: '#0f172a' }}
              />
              {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, fontSize: 13 }}>✕</button>}
            </div>
          </div>

          {GROUPS.map(group => {
            const renderedGroups = group.groups
              .map(sg => ({ ...sg, items: filtering ? sg.items.filter(t => t.label.toLowerCase().includes(q)) : sg.items }))
              .filter(sg => sg.items.length > 0)
            if (renderedGroups.length === 0) return null
            return (
              <div key={group.title}>
                <div style={{ padding: '8px 12px 4px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: group.color }}>
                  {group.title}
                </div>
                {renderedGroups.map(sg => (
                  <div key={sg.title || group.title}>
                    {sg.title && (
                      <div style={{ padding: '8px 12px 2px', fontSize: 10, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: '#cbd5e1' }}>
                        {sg.title}
                      </div>
                    )}
                    {sg.items.map(t => <SidebarLink key={t.href} t={t} active={activeFor(t)} pathname={pathname} onToggle={onToggle} />)}
                  </div>
                ))}
              </div>
            )
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', fontSize: 11 }}>
          <Link href="/home" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Volver a la tienda</Link>
        </div>
      </aside>
    </>
  )
}