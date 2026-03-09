'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function MainError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[MainLayout Error]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold font-headline">Algo salió mal</h1>
        <p className="text-muted-foreground">
          {error.message || 'Ha ocurrido un error inesperado en esta página.'}
        </p>
        <Button onClick={reset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Intentar de nuevo
        </Button>
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
