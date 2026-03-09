// ─── Timing ──────────────────────────────────────────────────────────────────

/** Debounce delay in ms for search inputs */
export const DEBOUNCE_DELAY_MS = 300

/** React Query stale time for product data (2 minutes) */
export const QUERY_STALE_TIME_MS = 2 * 60 * 1000

/** React Query garbage collection time (10 minutes) */
export const QUERY_GC_TIME_MS = 10 * 60 * 1000

// ─── UI ──────────────────────────────────────────────────────────────────────

/** Initial year shown when no year filter is active */
export const INITIAL_YEAR = new Date().getFullYear()

export const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Programado' },
  { value: 'IN_PROGRESS', label: 'En Proceso' },
  { value: 'DEMO_OK', label: 'Demo' },
  { value: 'LIVE', label: 'Productivo' },
] as const

export const MILESTONE_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Programado' },
  { value: 'IN_PROGRESS', label: 'En Proceso' },
  { value: 'COMPLETED', label: 'Completado' },
] as const

export const DEFAULT_COLORS = [
  '#778899', // Slate Blue (Primary)
  '#90EE90', // Soft Green (Accent)
  '#FFC0CB', // Pink
  '#ADD8E6', // Light Blue
  '#FFD700', // Gold
  '#E6E6FA', // Lavender
]
