import { Logo } from '@/components/icons/logo'
import { Button } from '@/components/ui/button'
import { Brain, Heart } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full min-h-screen overflow-hidden flex flex-col items-center justify-between gap-8 bg-neo-gray-light p-4">
      {/* Logo flotante arriba */}
      <div className=" w-full md:translate-x-10">
        <div className="w-fit translate-y-2 h-fit border-3 border-black shadow-neo-md bg-white p-3">
          <div className="flex items-center gap-2">
            <Logo
              className="h-8 w-8"
              style={{ color: 'oklch(67.47% .1725 259.61)' }}
            />
            <span className="font-headline text-xl font-bold uppercase">
              Roadmap Planner
            </span>
          </div>
        </div>
      </div>

      {/* Contenido centrado */}
      <main className="w-full max-w-md h-full min-h-fit flex flex-col items-center justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="-translate-y-2 min-h-fit text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-2">
          <p className=" font-normal">
            Designed & Developed by{' '}
            <span className=" font-bold">Marco Tortolani</span>
          </p>
          <Button
            variant="default"
            asChild
            className="flex items-center gap-2 border-2 text-black border-black px-4 py-2 bg-sky-200 rounded-sm "
          >
            <a href="/" target="_self" rel="noopener noreferrer">
              <span className="font-semibold">with</span>
              <Brain className="h-5 w-5 text-sky-600" strokeWidth={2.5} />
              <span className="font-semibold">+</span>
              <Heart
                className="h-5 w-5 text-red-500 fill-red-500"
                strokeWidth={2.5}
              />
            </a>
          </Button>
          <p>© 2026 Media-Moob · Roadmap Planner</p>
        </div>
      </footer>
    </div>
  )
}
