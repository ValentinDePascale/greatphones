import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
