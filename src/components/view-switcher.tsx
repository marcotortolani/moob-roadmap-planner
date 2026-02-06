// src/components/view-switcher.tsx

'use client';

import { useState, useEffect } from 'react';
import { List, Calendar } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * ViewSwitcher uses native browser APIs instead of useSearchParams/router.push
 * to avoid Suspense boundaries and cached RSC payload issues.
 * Dispatches a custom 'viewchange' event so the home page can react.
 */
export function ViewSwitcher() {
  const [currentView, setCurrentView] = useState('list');

  // Read initial view from URL or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlView = params.get('view');
    const savedView = localStorage.getItem('productView');
    setCurrentView(urlView || savedView || 'list');

    // Listen for view changes from other sources (e.g., popstate)
    const handleViewChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setCurrentView(detail);
    };
    window.addEventListener('viewchange', handleViewChange);
    return () => window.removeEventListener('viewchange', handleViewChange);
  }, []);

  const handleToggle = () => {
    const newView = currentView === 'list' ? 'calendar' : 'list';

    // Update state
    setCurrentView(newView);

    // Persist to localStorage
    localStorage.setItem('productView', newView);

    // Update URL without Next.js router (avoids RSC payload fetch)
    const params = new URLSearchParams(window.location.search);
    params.set('view', newView);
    window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);

    // Notify other components (home page) about the view change
    window.dispatchEvent(new CustomEvent('viewchange', { detail: newView }));
  };

  return (
    <button
      onClick={handleToggle}
      className="relative flex items-center gap-1 border-3 border-black p-1 shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[0px_0px_0px_0px_#000000] transition-all duration-150 ease-out"
      style={{ backgroundColor: '#F5F5F5' }}
      aria-label={`Cambiar a vista de ${currentView === 'list' ? 'calendario' : 'lista'}`}
    >
      {/* Indicador animado de fondo */}
      <div
        className={cn(
          'absolute inset-y-1 border-2 border-black shadow-[2px_2px_0px_0px_#000000] transition-all duration-150 ease-out',
          currentView === 'list'
            ? 'left-1 right-[calc(50%+2px)] sm:right-[calc(60%+2px)]'
            : 'left-[calc(50%+2px)] sm:left-[calc(40%+2px)] right-1'
        )}
        style={{ backgroundColor: '#FFFFFF' }}
      />

      {/* Opción Lista */}
      <div
        className={cn(
          'relative z-10 flex items-center gap-2 px-3 py-1.5 transition-all duration-150',
          currentView === 'list'
            ? 'font-bold'
            : 'font-normal'
        )}
        style={{ color: currentView === 'list' ? '#000000' : '#2A2A2A' }}
      >
        <List className="h-4 w-4" />
        <span className="hidden text-sm sm:inline">Lista</span>
      </div>

      {/* Opción Calendario */}
      <div
        className={cn(
          'relative z-10 flex items-center gap-2 px-3 py-1.5 transition-all duration-150',
          currentView === 'calendar'
            ? 'font-bold'
            : 'font-normal'
        )}
        style={{ color: currentView === 'calendar' ? '#000000' : '#2A2A2A' }}
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden text-sm sm:inline">Calendario</span>
      </div>
    </button>
  );
}
