import type { NextConfig } from "next";

const STATIC_CACHE = process.env.NODE_ENV === 'production'
  ? 'public, max-age=31536000, immutable'
  : 'public, max-age=5, stale-while-revalidate=300';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  turbopack: {},
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',') || ['192.168.18.9:3000', '192.168.18.9', '192.168.0.0/16', '10.0.0.0/8'],
  async headers() {
    return [
      // Static assets with ?v= versioning: immutable in prod (new ?v busts the cache)
      {
        source: '/lib/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_CACHE }],
      },
      {
        source: '/vendor/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_CACHE }],
      },
      {
        source: '/styles/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_CACHE }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: STATIC_CACHE }],
      },
      {
        source: '/(account|orders|wallet|admin|api/auth|api/instore|api/warranty)/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      // CSP se aplica en middleware.ts (permite nonces por-request).
      // No duplicar acá para evitar reglas contradictorias.
    ];
  },
};

export default nextConfig;
