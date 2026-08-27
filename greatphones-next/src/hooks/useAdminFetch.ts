'use client'

import { useCallback, useEffect, useState } from 'react'

export function useAdminFetch<T>(endpoint: string | null) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!endpoint) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(endpoint, { credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'Error')
      setData(Array.isArray(d) ? d : Array.isArray((d as any)?.data) ? (d as any).data : [])
    } catch (e: any) {
      setError(e?.message || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    let activo = true
    if (!endpoint) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(endpoint, { credentials: 'include' })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!activo) return
        if (!ok) throw new Error(d?.error || 'Error')
        const arr = Array.isArray(d) ? d : Array.isArray((d as any)?.data) ? (d as any).data : []
        setData(arr)
        setError(null)
      })
      .catch((e: any) => {
        if (!activo) return
        setError(e?.message || 'Error de conexión')
      })
      .finally(() => {
        if (activo) setLoading(false)
      })
    return () => {
      activo = false
    }
  }, [endpoint])

  return { data, setData, loading, error, reload }
}
