import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @ts-ignore
  optimizeFonts: false,
  allowedDevOrigins: ['172.16.0.2', 'localhost'],
  experimental: {
    optimizePackageImports: ['@intervu/shared'],
  },
};

export default nextConfig;
