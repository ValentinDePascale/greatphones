# Admin Panel Speed & Consistency Fix

## Step 1: Revert AdminSidebar.jsx to `<Link>`

File: `src/components/AdminSidebar.tsx`

Change lines 1-3:
```
'use client'

import { usePathname } from 'next/navigation'
```
To:
```
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
```

Change line 31: `<a href="/admin"` → `<Link href="/admin"`
Change line 33: `</a>` → `</Link>`
Change line 41: `<a key={t.href} href={t.href}` → `<Link key={t.href} href={t.href}`
Change line 51: `</a>` → `</Link>`
Change line 57: `<a href="/"` → `<Link href="/"`
Change line 57: `</a>` → `</Link>`

## Step 2: Create AdminPageClient.tsx

New file: `src/app/admin/AdminPageClient.tsx`

Content:
```tsx
'use client'

import { useEffect, useRef } from 'react'

interface Props {
  html: string
  tab: string
}

export default function AdminPageClient({ html, tab }: Props) {
  const calledRef = useRef(false)

  useEffect(() => {
    calledRef.current = false
    const tryRender = (): boolean => {
      if (typeof (window as any).renderAdminContent === 'function') {
        if (!calledRef.current) {
          calledRef.current = true
          ;(window as any).renderAdminContent(tab)
        }
        return true
      }
      return false
    }
    if (!tryRender()) {
      const interval = setInterval(() => {
        if (tryRender()) clearInterval(interval)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [tab])

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  )
}
```

## Step 3: Update all admin page.tsx files (13 files)

Each file follows this pattern — change from:
```tsx
import { serveAdminSpa } from '@/lib/spa-pages'
export const dynamic = 'force-dynamic'
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveAdminSpa('tab-name') }} suppressHydrationWarning /> }
```
To:
```tsx
import { serveAdminSpa } from '@/lib/spa-pages'
import AdminPageClient from '../AdminPageClient'
export const dynamic = 'force-dynamic'
export default function Page() {
  const html = serveAdminSpa('tab-name')
  return <AdminPageClient html={html} tab="tab-name" />
}
```

Files to update (with their tab names):
1.  `src/app/admin/page.tsx` → tab: `'dashboard'`
2.  `src/app/admin/productos/page.tsx` → tab: `'prods'`
3.  `src/app/admin/accesorios/page.tsx` → tab: `'acc'`
4.  `src/app/admin/stock/page.tsx` → tab: `'stock'`
5.  `src/app/admin/promos/page.tsx` → tab: `'promos'`
6.  `src/app/admin/pedidos/page.tsx` → tab: `'orders'`
7.  `src/app/admin/arrepentimientos/page.tsx` → tab: `'arrep'`
8.  `src/app/admin/chat/page.tsx` → tab: `'chat'`
9.  `src/app/admin/cotizaciones/page.tsx` → tab: `'quotes'`
10. `src/app/admin/instore/page.tsx` → tab: `'instore'`
11. `src/app/admin/preventa/page.tsx` → tab: `'preventa'`
12. `src/app/admin/ventas/page.tsx` → tab: `'sales'`
13. `src/app/admin/usuarios/page.tsx` → tab: `'users'`

Note: For the dashboard (file #1), it currently calls `serveAdminSpa()` without params. We already fixed it to pass `'dashboard'` in a previous session.

## Step 4: Fix race condition in render.js

File: `public/lib/render.js`

Remove 3 blocks that auto-render admin content with 'prods' default:

### Block A — loadProducts() pre-fetched path (lines ~140-143):
```js
    if(document.getElementById('adminContent')){
      var currentTab=window.currentAdminTab||'prods';
      renderAdminContent(currentTab);
    }
```
→ DELETE these 4 lines

### Block B — loadProducts() fetch .then() path (lines ~167-169):
```js
    if(document.getElementById('adminContent')){
      var currentTab=window.currentAdminTab||'prods';
      renderAdminContent(currentTab);
    }
```
→ DELETE these 4 lines

### Block C — loadAccessories() fetch .then() path (lines ~196-198):
```js
    if(document.getElementById('adminContent')){
      var currentTab=window.currentAdminTab||'prods';
      renderAdminContent(currentTab);
    }
```
→ DELETE these 4 lines

## Step 5: Clean up serveAdminSpa script injection

File: `src/lib/spa-pages.ts`

Remove lines 86-105 — the entire script injection block:
```ts
  if (activeTab) {
    const tabFnMap: Record<string, string> = {
      dashboard: 'renderAdminContent("dashboard")',
      prods: 'renderAdminContent("prods")',
      ...etc...
    }
    const fn = tabFnMap[activeTab]
    if (fn) {
      html = html.replace('</body>', `<script>setTimeout(...)</script></body>`)
    }
  }
```

The new `serveAdminSpa` should just return the HTML without injecting any script, since `AdminPageClient.tsx` handles calling `renderAdminContent()` via `useEffect`.

After removing lines 86-105, the function ends at `return html` (line 107). The final function should look like:

```ts
export function serveAdminSpa(activeTab?: string): string {
  loadShell()
  if (!_shell) return '<h1>Loading...</h1>'
  let allPages = loadAllPages()
  let html = _shell.replace('</body>', allPages + '</body>')
  html = html.replace('class="page" id="p-admin"', 'class="page act" id="p-admin"')
  html = html.replace('class="page act" id="p-home"', 'class="page" id="p-home"')
  html = wrapMain(html)
  return html
}
```
