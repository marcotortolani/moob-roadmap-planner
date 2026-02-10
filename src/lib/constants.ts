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
