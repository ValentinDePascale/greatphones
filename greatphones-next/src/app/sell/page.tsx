import { serveSpa } from '@/lib/spa-pages'
export const dynamic = 'force-dynamic'
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('sell') }} suppressHydrationWarning /> }
