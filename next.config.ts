import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Output: 'standalone' for Docker/self-hosted. Remove or set to undefined for Vercel.
  // Vercel auto-detects Next.js and doesn't need this.
  // output: 'standalone',

  // Future-proof: these settings work on Vercel, Railway, Fly.io, Docker, etc.
  poweredByHeader: false,

  // Image optimization — works on all platforms
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers — platform-agnostic
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
