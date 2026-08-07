'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function CatalogSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const doSearch = useCallback((q: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (q) params.set('search', q)
    else params.delete('search')
    router.push(`/productos?${params.toString()}`)
  }, [router, searchParams])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v), 400)
  }, [doSearch])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="pg-sort" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          value={value}
          onChange={handleChange}
          placeholder="Buscar iPhone, Samsung, MacBook..."
          className="f-input"
          style={{ paddingLeft: 36 }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setValue(''); doSearch('') }
          }}
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      {value && (
        <button onClick={() => { setValue(''); doSearch('') }} className="chip" style={{ whiteSpace: 'nowrap' }}>
          Limpiar
        </button>
      )}
    </div>
  )
}
