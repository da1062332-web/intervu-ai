import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['@intervu/shared'],
  },
  optimizeFonts: false,
};

export default nextConfig;
