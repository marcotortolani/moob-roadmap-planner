import { Logo } from '@/components/icons/logo'
import { Brain, Heart } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-neo-gray-light p-4">
      {/* Logo flotante arriba */}
      <div className="absolute top-8 left-8 border-3 border-black shadow-neo-md bg-white p-3">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" style={{ color: 'oklch(67.47% .1725 259.61)' }} />
          <span className="font-headline text-xl font-bold uppercase">
            Roadmap Planner
          </span>
        </div>
      </div>

      {/* Contenido centrado */}
      <main className="w-full max-w-md">{children}</main>

      {/* Footer */}
      <footer className="absolute bottom-4 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-2">
          <p>Designed & Developed by Marco Tortolani</p>
          <div className="flex items-center gap-1.5">
            <span>with</span>
            <Brain className="h-4 w-4 text-sky-500" />
            <span>+</span>
            <Heart className="h-4 w-4 text-red-500" />
          </div>
          <p>© 2026 Media-Moob · Roadmap Planner</p>
        </div>
      </footer>
    </div>
  )
}
