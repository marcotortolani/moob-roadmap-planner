import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Explicit cache headers for all dynamic routes (HTML, RSC payloads).
  // Acts as a safety net alongside middleware and force-dynamic.
  // Static assets (_next/static) are excluded and use immutable long cache.
  headers: async () => [
    {
      source: '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'private, no-cache, no-store, max-age=0, must-revalidate',
        },
        {
          key: 'CDN-Cache-Control',
          value: 'no-store',
        },
        {
          key: 'Surrogate-Control',
          value: 'no-store',
        },
      ],
    },
  ],
};

export default nextConfig;
