'use client'

import { useState } from 'react'

export default function Header() {
  const [activeNav, setActiveNav] = useState('home')

  const navItems = [
    { id: 'home', label: 'Inicio' },
    { id: 'shop', label: 'Catalogo' },
    { id: 'ofertas', label: 'Ofertas' },
    { id: 'vender', label: 'Vender' },
    { id: 'servicio', label: 'Servicio' },
  ]

  return (
    <>
      {/* Topbar */}
      <div className="bg-[var(--dk)] text-white text-xs py-2">
        <div className="ctr flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span>📍</span>
              <span>Bahia Blanca</span>
            </span>
            <span className="flex items-center gap-1 text-[var(--orange)]">
              <span>📱</span>
              <span>WhatsApp: 291 123-4567</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span> GP &#9825; 0</span>
            <span>Carrito &#128722; <span className="hidden">0</span></span>
          </div>
        </div>
      </div>

      {/* MainNav */}
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-50">
        <div className="ctr flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <span className="font-serif text-xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Great Phones
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar equipos..."
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--cream)] text-sm"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[var(--orange)] text-white text-xs rounded">
                Buscar
              </button>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  activeNav === item.id
                    ? 'text-[var(--orange)] font-medium'
                    : 'text-[var(--gray)] hover:text-[var(--orange)]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button className="px-3 py-2 text-sm text-[var(--gray)] hover:text-[var(--orange)]">
              Accesorios
            </button>
            <button className="px-3 py-2 text-sm text-[var(--gray)] hover:text-[var(--orange)]">
              Mi cuenta
            </button>
          </div>
        </div>
      </nav>

      {/* CategoryNav */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="ctr py-2">
          <div className="flex items-center gap-6 overflow-x-auto">
            <button className="flex flex-col items-center gap-1 text-xs text-[var(--gray)] hover:text-[var(--orange)] shrink-0">
              <span className="text-2xl">📱</span>
              <span>iPhone</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-xs text-[var(--gray)] hover:text-[var(--orange)] shrink-0">
              <span className="text-2xl">📱</span>
              <span>Samsung</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-xs text-[var(--gray)] hover:text-[var(--orange)] shrink-0">
              <span className="text-2xl">💻</span>
              <span>MacBook</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-xs text-[var(--gray)] hover:text-[var(--orange)] shrink-0">
              <span className="text-2xl">📱</span>
              <span>iPad</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-xs text-[var(--gray)] hover:text-[var(--orange)] shrink-0">
              <span className="text-2xl">⌚</span>
              <span>Apple Watch</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-xs text-[var(--gray)] hover:text-[var(--orange)] shrink-0">
              <span className="text-2xl">🎧</span>
              <span>Accesorios</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-xs text-[var(--gray)] hover:text-[var(--orange)] shrink-0">
              <span className="text-2xl">🔧</span>
              <span>Reparacion</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-xs text-[var(--gray)] hover:text-[var(--orange)] shrink-0">
              <span className="text-2xl">🏷️</span>
              <span>Ofertas</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
