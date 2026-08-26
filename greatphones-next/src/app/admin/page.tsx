import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// La pantalla inicial del panel es el Calendario de pendientes.
// El Dashboard legacy vive en /admin/dashboard.
export default function Page() {
  redirect('/admin/analisis/calendario')
}