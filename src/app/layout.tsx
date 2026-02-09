import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from '@/context/auth-context';
import { GoogleAnalytics } from '@/components/google-analytics';
import { ReactQueryProvider } from '@/lib/react-query/provider';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Product Roadmap Planner',
  description: 'Plan and visualize your product roadmap with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <ReactQueryProvider>
              <AuthProvider>
                <div className="font-body antialiased" suppressHydrationWarning>
                  {children}
                </div>
                <Toaster />
              </AuthProvider>
            </ReactQueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
