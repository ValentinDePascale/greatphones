import { serveSpa } from '@/lib/spa-pages'
export default function Page() { return <div dangerouslySetInnerHTML={{ __html: serveSpa('track-order') }} suppressHydrationWarning /> }
