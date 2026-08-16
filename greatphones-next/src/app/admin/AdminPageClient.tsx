'use client'

import { useEffect } from 'react'

interface Props {
  html: string
  tab: string
}

export default function AdminPageClient({ html, tab }: Props) {
  useEffect(() => {
    // Marcar p-admin y sus wrappers internos como visibles. El AdminSidebar
    // de React ocupa el slot izquierdo del layout, pero el contenido del admin
    // (dashboard, productos, etc.) se inyecta dentro de <div id="p-admin">
    // que viene del HTML legacy. Sin hacer visible p-admin, todo el contenido
    // queda oculto por el CSS .page { display: none } que oculta todas las
    // pages del SPA legacy.
    const pAdmin = document.getElementById('p-admin')
    if (pAdmin) {
      pAdmin.classList.add('act')
      pAdmin.style.display = 'block'
      // El sidebar HTML dentro de p-admin ya está oculto por globals.css
      // (#p-admin .admin-sidebar { display: none }), así que solo queda el main
      pAdmin.querySelector('.admin-layout')?.classList.add('act')
      pAdmin.querySelector('.admin-main')?.classList.add('act')
    }

    setTimeout(() => {
      const fn = (window as any).renderAdminContent || window.renderAdminContent
      if (typeof fn === 'function') fn(tab)
    }, 300)
  }, [tab])

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}
