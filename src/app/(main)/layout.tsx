import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

// Force dynamic rendering for all pages in the (main) route group.
// This MUST be in a server component - it's ignored in 'use client' files.
// Prevents Vercel CDN from caching static HTML with stale Suspense fallbacks.
export const dynamic = 'force-dynamic'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="h-full flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
