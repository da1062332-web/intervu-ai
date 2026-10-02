import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  allowedDevOrigins: [
    '172.16.0.2',
    'localhost',
    '127.0.0.1',
    'app.skillitrix.com',
    'skillitrix.com',
    '*.skillitrix.com',
  ],
  experimental: {
    optimizePackageImports: [
      '@intervu/shared',
      'lucide-react',
      '@phosphor-icons/react',
      'date-fns',
      'framer-motion',
      '@tanstack/react-query',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
