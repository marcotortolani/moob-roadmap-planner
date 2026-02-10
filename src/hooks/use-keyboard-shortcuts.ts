// src/hooks/use-keyboard-shortcuts.ts

'use client'

import { useEffect, useCallback } from 'react'

/**
 * Global keyboard shortcuts for the app (Quick Win 2)
 *
 * Shortcuts:
 * - Cmd/Ctrl + K: Focus search input
 * - Cmd/Ctrl + N: Open create product modal
 * - Cmd/Ctrl + /: Show keyboard shortcuts help (future)
 * - Escape: Close modals/sheets (handled by ShadCN components)
 */
export function useKeyboardShortcuts() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifierKey = isMac ? e.metaKey : e.ctrlKey

    // Cmd/Ctrl + K: Focus search
    if (modifierKey && e.key === 'k') {
      e.preventDefault()
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], input[placeholder*="Buscar"]'
      )
      if (searchInput) {
        searchInput.focus()
        searchInput.select()
      }
    }

    // Cmd/Ctrl + N: Open create product modal
    if (modifierKey && e.key === 'n') {
      e.preventDefault()
      const createButton = document.querySelector<HTMLButtonElement>(
        '[data-create-product-button], [aria-label*="Crear"], button[aria-label*="nuevo producto"]'
      )
      if (createButton) {
        createButton.click()
      } else {
        // Fallback: dispatch custom event
        window.dispatchEvent(new CustomEvent('keyboard:create-product'))
      }
    }

    // Cmd/Ctrl + /: Show shortcuts help (future enhancement)
    if (modifierKey && e.key === '/') {
      e.preventDefault()
      console.log('⌨️ Keyboard Shortcuts:')
      console.log('  Cmd/Ctrl + K: Focus search')
      console.log('  Cmd/Ctrl + N: Create new product')
      console.log('  Escape: Close modals')
      // TODO: Show toast or modal with shortcuts
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
