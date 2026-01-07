import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/context/auth-context';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="h-full flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
