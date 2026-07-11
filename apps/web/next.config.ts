import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @ts-ignore
  optimizeFonts: false,
  experimental: {
    optimizePackageImports: ['@intervu/shared'],
  },
};

export default nextConfig;
