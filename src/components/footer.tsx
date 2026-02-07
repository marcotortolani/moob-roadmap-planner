'use client'

import { Brain, Heart } from 'lucide-react'
import { Button } from './ui/button'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t-[3px] border-black bg-white shadow-[0_-6px_0px_0px_#000000] py-8 text-center text-sm text-black">
      <div className="flex flex-col items-center justify-center gap-3">
        <p className=" text-base">
          Designed & Developed by{' '}
          <span className="font-bold">Marco Tortolani</span>
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
        <p className="mt-1 text-xs font-medium">
          &copy; {currentYear} All rights reserved.
        </p>
      </div>
    </footer>
  )
}
