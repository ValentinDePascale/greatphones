'use client'

import { useCallback, useState } from 'react'
import { useAdminFetch } from './useAdminFetch'

export function useCrud<T extends { id: string }>(endpoint: string) {
  const { data: rows, setData: setRows, loading, error, reload } = useAdminFetch<T>(endpoint)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ t: 'success' | 'error'; s: string } | null>(null)

  const showToast = useCallback((t: 'success' | 'error', s: string) => {
    setToast({ t, s })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const create = useCallback(
    async (payload: Omit<T, 'id'>) => {
      setSaving(true)
      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || 'Error')
        setRows(prev => [...prev, d])
        showToast('success', 'Creado')
        return d as T
      } catch (e: any) {
        showToast('error', e?.message || 'Error de conexión')
        throw e
      } finally {
        setSaving(false)
      }
    },
    [endpoint, setRows, showToast],
  )

  const update = useCallback(
    async (id: string, payload: Partial<T>) => {
      setSaving(true)
      try {
        const r = await fetch(endpoint, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...payload }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || 'Error')
        setRows(prev => prev.map(x => (x.id === id ? { ...x, ...payload } as T : x)))
        showToast('success', 'Actualizado')
        return d
      } catch (e: any) {
        showToast('error', e?.message || 'Error de conexión')
        throw e
      } finally {
        setSaving(false)
      }
    },
    [endpoint, setRows, showToast],
  )

  const remove = useCallback(
    async (id: string, confirmText = '¿Eliminar?') => {
      if (!confirm(confirmText)) return false
      const r = await fetch(`${endpoint}?id=${id}`, { method: 'DELETE', credentials: 'include' })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        showToast('error', (d as any)?.error || 'Error')
        return false
      }
      setRows(prev => prev.filter(x => x.id !== id))
      showToast('success', 'Eliminado')
      return true
    },
    [endpoint, setRows, showToast],
  )

  return { rows, setRows, loading, error, reload, saving, toast, showToast, setToast, create, update, remove }
}
