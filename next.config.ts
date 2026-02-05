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
  // Cache headers are now handled by Next.js automatically:
  // - Dynamic pages (force-dynamic in layout): private, no-cache, no-store
  // - Static assets (_next/static): immutable, long cache
  // The previous 'public, max-age=0' header was causing Vercel CDN to cache
  // dynamic HTML responses, serving stale pages with unresolved Suspense.
};

export default nextConfig;
