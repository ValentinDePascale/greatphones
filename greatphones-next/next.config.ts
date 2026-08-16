import type { NextConfig } from "next";

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
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',') || [],
  async headers() {
    return [
      // Static assets: short cache in dev, immutable in prod
      {
        source: '/lib/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=3600' }],
      },
      {
        source: '/styles/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=3600' }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
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
