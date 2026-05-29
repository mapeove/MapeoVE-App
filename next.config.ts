import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Next.js 16 usa Turbopack por defecto — configuracion vacia para silenciar warning
  turbopack: {},
};

export default nextConfig;
