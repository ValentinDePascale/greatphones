'use client'

import { Suspense } from 'react'
import { PendingContent } from './PendingContent'

export default function PendingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Cargando...</p>
      </div>
    }>
      <PendingContent />
    </Suspense>
  )
}
