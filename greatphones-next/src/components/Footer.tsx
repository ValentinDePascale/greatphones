export default function Footer() {
  const footerLinks = {
   Shop: ['Catalogo', 'iPhone', 'Samsung', 'MacBook', 'Ofertas'],
    Vendemos: ['Vender equipo', 'Cotizacion', 'Mayoristas'],
    Servicios: ['Servicio tecnico', 'Reparaciones', 'Garantias'],
    Empresa: ['Contacto', 'Ubicacion', 'Terminos'],
  }

  return (
    <footer className="bg-[var(--dk)] text-white pt-12 pb-6">
      <div className="ctr">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-medium text-sm mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-[var(--gray2)] hover:text-[var(--orange)]">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[rgba(255,255,255,0.1)] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <span className="font-serif" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Great Phones
            </span>
          </div>
          <div className="text-xs text-[var(--gray2)]">
            Zelarrayan 179, Bahia Blanca &middot; © 2025 Great Phones
          </div>
          <div className="flex items-center gap-3 text-lg">
            <a href="#" className="hover:text-[var(--orange)]">📷</a>
            <a href="#" className="hover:text-[var(--orange)]">📘</a>
            <a href="#" className="hover:text-[var(--orange)]">📱</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
