import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://greatphones.com.ar'

  const staticPages = [
    '',
    '/productos',
    '/ofertas',
    '/accesorios',
    '/garantias',
    '/preventas',
    '/sell',
    '/compare',
    '/track-order',
    '/terminos',
    '/privacidad',
  ]

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))
}
