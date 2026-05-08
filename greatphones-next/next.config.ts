import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/:path((?!api|_next|icons|styles|lib|fonts).*)",
        destination: "/index.html",
      },
    ];
  },
};

export default nextConfig;
