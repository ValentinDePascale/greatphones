import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { serveSpa } from '@/lib/spa-pages'

export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('ofertas') }} suppressHydrationWarning /> }
