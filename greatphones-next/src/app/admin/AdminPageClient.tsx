'use client'

import { useEffect } from 'react'

interface Props {
  html: string
  tab: string
}

export default function AdminPageClient({ html, tab }: Props) {
  useEffect(() => {
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
