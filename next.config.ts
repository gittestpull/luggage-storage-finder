import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: 'public',
  // 개발 모드에서도 PWA 활성화하려면 false, 아니면 true (기본값)
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    importScripts: ['/custom-sw.js'],
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
};

export default withPWA(nextConfig);
