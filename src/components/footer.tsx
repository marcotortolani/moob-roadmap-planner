'use client';

import { Brain, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background/80 py-8 text-center text-sm text-muted-foreground backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-2">
        <p>Designed & Developed by Marco Tortolani</p>
        <div className="flex items-center gap-1.5">
          <span>with</span>
          <Brain className="h-4 w-4 text-sky-500" />
          <span>+</span>
          <Heart className="h-4 w-4 text-red-500" />
        </div>
        <p className="mt-2 text-xs">&copy; {currentYear} All rights reserved.</p>
      </div>
    </footer>
  );
}
