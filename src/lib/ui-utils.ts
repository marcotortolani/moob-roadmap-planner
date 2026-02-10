/**
 * UI Utility Classes and Helper Functions
 *
 * This file contains reusable utility functions and class name patterns
 * to maintain consistency across the application.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with tailwind-merge to handle conflicts
 * This is the same as the cn() function from lib/utils.ts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Common UI Pattern Classes
 * These can be used as base classes and extended with additional styles
 */

// Card Patterns
export const cardStyles = {
  base: 'rounded-lg p-card-padding shadow-sm bg-card text-card-foreground',
  hover:
    'rounded-lg p-card-padding shadow-sm hover:shadow-lg transition-shadow bg-card text-card-foreground',
  interactive:
    'rounded-lg p-card-padding shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-card text-card-foreground cursor-pointer',
  bordered:
    'rounded-lg p-card-padding border bg-card text-card-foreground shadow-sm',
}

// Badge Patterns
export const badgeStyles = {
  base: 'rounded-sm px-1.5 py-1 text-xs font-medium',
  outline: 'rounded-sm px-1.5 py-1 text-xs font-medium border',
  pill: 'rounded-full px-2 py-1 text-xs font-medium',
}

// Button Icon Patterns
export const buttonIconStyles = {
  sm: 'h-6 w-6 sm:h-7 sm:w-7',
  base: 'h-8 w-8 sm:h-9 sm:w-9',
  lg: 'h-10 w-10 sm:h-11 sm:w-11',
}

// Icon Sizes
export const iconStyles = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  base: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
}

// Input Patterns
export const inputStyles = {
  base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  withIcon: 'pl-8',
  error: 'border-destructive focus-visible:ring-destructive',
}

// Text Patterns
export const textStyles = {
  heading: {
    h1: 'scroll-m-20 text-4xl font-bold font-headline tracking-tight lg:text-5xl',
    h2: 'scroll-m-20 text-3xl font-semibold font-headline tracking-tight',
    h3: 'scroll-m-20 text-2xl font-semibold font-headline tracking-tight',
    h4: 'scroll-m-20 text-xl font-semibold font-headline tracking-tight',
  },
  body: {
    large: 'text-lg font-body',
    base: 'text-base font-body leading-7',
    small: 'text-sm font-body leading-relaxed',
    xs: 'text-xs font-body',
  },
  muted: 'text-muted-foreground',
  code: 'font-code',
}

// Layout Patterns
export const layoutStyles = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  section: 'space-y-section-gap',
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    dashboard: 'grid gap-4 grid-cols-2 lg:grid-cols-4',
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start',
    column: 'flex flex-col',
  },
}

// Animation Classes
export const animationStyles = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  scaleIn: 'animate-scale-in',
  transition: {
    base: 'transition-all duration-200',
    fast: 'transition-all duration-150',
    slow: 'transition-all duration-300',
  },
}

// Status Colors (matching product status)
export const statusColors = {
  PLANNED: {
    bg: 'bg-slate-400/20',
    text: 'text-slate-700',
    border: 'border-slate-400/30',
  },
  IN_PROGRESS: {
    bg: 'bg-red-500/20',
    text: 'text-red-700',
    border: 'border-red-500/30',
  },
  DEMO_OK: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-700',
    border: 'border-yellow-500/30',
  },
  LIVE: {
    bg: 'bg-green-500/20',
    text: 'text-green-700',
    border: 'border-green-500/30',
  },
}

// Filter/Search Bar Pattern
export const searchBarStyles = {
  wrapper:
    'relative flex-1 lg:flex-none xl:max-w-full xl:min-w-[200px] 2xl:min-w-[300px] 2xl:max-w-[400px]',
  icon: 'absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground',
  input: 'pl-8 w-full',
}

// Sheet/Modal Patterns
export const modalStyles = {
  overlay: 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
  content: 'fixed z-50 gap-4 bg-background p-6 shadow-lg',
  header: 'flex flex-col space-y-1.5 text-center sm:text-left',
  footer: 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
}

/**
 * Helper function to get status badge classes
 */
export function getStatusBadgeClasses(status: keyof typeof statusColors) {
  const colors = statusColors[status]
  return cn(badgeStyles.outline, colors.bg, colors.text, colors.border)
}

/**
 * Helper function to combine card styles with custom classes
 */
export function getCardClasses(
  variant: keyof typeof cardStyles = 'base',
  customClasses?: string,
) {
  return cn(cardStyles[variant], customClasses)
}

/**
 * Helper function to get responsive icon size
 */
export function getIconSize(size: keyof typeof iconStyles = 'base') {
  return iconStyles[size]
}

/**
 * Helper function to get button icon size
 */
export function getButtonIconSize(
  size: keyof typeof buttonIconStyles = 'base',
) {
  return buttonIconStyles[size]
}
