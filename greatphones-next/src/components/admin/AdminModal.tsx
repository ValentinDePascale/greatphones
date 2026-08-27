'use client'

import { useCallback, useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  icon?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: number
}

export default function AdminModal({ open, onClose, title, icon, children, footer, maxWidth = 560 }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)
  const prevOverflow = useRef<string>('')

  const handleClose = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    if (!open) return
    prevOverflow.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = requestAnimationFrame(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      first?.focus()
    })
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        handleClose()
        return
      }
      if (ev.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const primero = focusables[0]
        const ultimo = focusables[focusables.length - 1]
        if (!ev.shiftKey && document.activeElement === ultimo) {
          ev.preventDefault()
          primero.focus()
        } else if (ev.shiftKey && (document.activeElement === primero || document.activeElement === modalRef.current)) {
          ev.preventDefault()
          ultimo.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow.current
      cancelAnimationFrame(t)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, handleClose])

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={handleClose} aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.45)' }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={modalRef}
        tabIndex={-1}
        className="pm-card"
        style={{
          position: 'relative',
          zIndex: 1,
          width: `min(92vw, ${maxWidth}px)`,
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#fff',
          border: '1px solid #E6E7F0',
          borderRadius: 14,
          padding: 22,
          boxShadow: '0 12px 48px rgba(23,23,45,.22)',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#181B2E', margin: 0 }}>
            {icon && <span className="material-symbols-outlined" style={{ fontSize: 19, color: '#FF6B2C' }} aria-hidden="true">{icon}</span>}
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="pe-btn pe-iconbtn"
            aria-label="Cerrar"
            title="Cerrar (Esc)"
            style={{ background: '#EEF0F6', color: '#64748B', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'inline-flex' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }} aria-hidden="true">close</span>
          </button>
        </div>
        <div style={{ marginTop: 10 }}>{children}</div>
        {footer && <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  )
}
