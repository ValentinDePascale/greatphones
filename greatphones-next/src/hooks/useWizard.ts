'use client'

import { useCallback, useRef, useState } from 'react'

export function useWizard(total: number) {
  const [step, setStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverMsg, setServerMsg] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const errRef = useRef<HTMLDivElement>(null)

  const goTo = useCallback(
    (dest: number, validate?: (p: number) => Record<string, string>) => {
      if (dest > step && validate) {
        const e = validate(step)
        setErrors(e)
        if (Object.keys(e).length > 0) {
          requestAnimationFrame(() => {
            errRef.current?.focus({ preventScroll: true })
            errRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          })
          return false
        }
      }
      setServerMsg(null)
      setErrors({})
      setStep(dest)
      setMaxStep(m => Math.max(m, dest))
      return true
    },
    [step],
  )

  const clearError = useCallback((id: string) => {
    setErrors(prev => {
      if (!prev[id]) return prev
      const n = { ...prev }
      delete n[id]
      return n
    })
  }, [])

  const reset = useCallback(() => {
    setStep(1)
    setMaxStep(1)
    setErrors({})
    setServerMsg(null)
    setSending(false)
  }, [])

  return { step, setStep, maxStep, setMaxStep, errors, setErrors, serverMsg, setServerMsg, sending, setSending, errRef, goTo, clearError, reset }
}
