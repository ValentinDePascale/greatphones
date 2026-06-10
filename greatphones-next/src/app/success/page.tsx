'use client'

import { Suspense } from 'react'
import { SuccessContent } from './SuccessContent'

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <p style={{ color: '#6b7280' }}>Cargando...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
