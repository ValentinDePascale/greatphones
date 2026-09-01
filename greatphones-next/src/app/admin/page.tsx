import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// La pantalla inicial del panel es el Calendario de pendientes.
export default function Page() {
  redirect('/admin/analisis/calendario')
}