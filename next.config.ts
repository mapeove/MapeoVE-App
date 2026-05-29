import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel maneja el output automáticamente, no necesitamos standalone
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
};

export default nextConfig;
