import { describe, it, expect } from 'vitest'
import { mapDbProduct, mapDbMilestone, mapDbUserRef, type DbProduct } from '../data-mappers'

const dbMilestone = {
  id: 'm1',
  name: 'Beta launch',
  start_date: '2026-03-15T12:00:00.000Z', // noon UTC — avoids midnight timezone boundary shifts
  end_date: '2026-03-31T12:00:00.000Z',
  status: 'PENDING',
  product_id: 'p1',
}

const dbUser = {
  id: 'u1',
  email: 'test@example.com',
  first_name: 'Ana',
  last_name: 'García',
  avatar_url: 'https://example.com/avatar.png',
}

const dbProduct: DbProduct = {
  id: 'p1',
  name: 'Mi Producto',
  operator: 'Movistar',
  country: 'ES',
  language: 'es-ES',
  status: 'PLANNED',
  start_date: '2026-01-01T00:00:00.000Z',
  end_date: '2026-12-31T00:00:00.000Z',
  card_color: '#FF6B6B',
  productive_url: 'https://example.com',
  vercel_demo_url: null,
  wp_content_prod_url: null,
  wp_content_test_url: null,
  chatbot_url: null,
  comments: 'Test comment',
  created_at: '2026-01-01T10:00:00.000Z',
  updated_at: '2026-01-15T10:00:00.000Z',
  created_by_id: 'u1',
  updated_by_id: null,
  milestones: [dbMilestone],
  customUrls: [],
  createdBy: dbUser,
  updatedBy: null,
}

describe('mapDbMilestone', () => {
  it('converts snake_case fields to camelCase', () => {
    const result = mapDbMilestone(dbMilestone)
    expect(result.id).toBe('m1')
    expect(result.name).toBe('Beta launch')
    expect(result.status).toBe('PENDING')
    expect(result.productId).toBe('p1')
  })

  it('produces Date objects for startDate and endDate', () => {
    const result = mapDbMilestone(dbMilestone)
    expect(result.startDate).toBeInstanceOf(Date)
    expect(result.endDate).toBeInstanceOf(Date)
  })

  it('parses start date to the correct local year and month', () => {
    const result = mapDbMilestone(dbMilestone)
    // startOfDay normalizes to local midnight, so use local getters (not UTC)
    expect(result.startDate.getFullYear()).toBe(2026)
    expect(result.startDate.getMonth()).toBe(2) // March = 2 (0-indexed)
  })
})

describe('mapDbUserRef', () => {
  it('concatenates first and last name', () => {
    const result = mapDbUserRef(dbUser)
    expect(result.name).toBe('Ana García')
  })

  it('trims name when last_name is null', () => {
    const result = mapDbUserRef({ ...dbUser, last_name: null })
    expect(result.name).toBe('Ana')
  })

  it('maps avatarUrl correctly', () => {
    const result = mapDbUserRef(dbUser)
    expect(result.avatarUrl).toBe('https://example.com/avatar.png')
  })

  it('returns undefined avatarUrl when null', () => {
    const result = mapDbUserRef({ ...dbUser, avatar_url: null })
    expect(result.avatarUrl).toBeUndefined()
  })
})

describe('mapDbProduct', () => {
  it('maps all top-level scalar fields', () => {
    const result = mapDbProduct(dbProduct)
    expect(result.id).toBe('p1')
    expect(result.name).toBe('Mi Producto')
    expect(result.operator).toBe('Movistar')
    expect(result.country).toBe('ES')
    expect(result.language).toBe('es-ES')
    expect(result.status).toBe('PLANNED')
    expect(result.cardColor).toBe('#FF6B6B')
    expect(result.productiveUrl).toBe('https://example.com')
    expect(result.comments).toBe('Test comment')
  })

  it('converts date strings to Date objects', () => {
    const result = mapDbProduct(dbProduct)
    expect(result.startDate).toBeInstanceOf(Date)
    expect(result.endDate).toBeInstanceOf(Date)
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })

  it('maps null URL fields to null', () => {
    const result = mapDbProduct(dbProduct)
    expect(result.vercelDemoUrl).toBeNull()
    expect(result.chatbotUrl).toBeNull()
  })

  it('maps milestones array', () => {
    const result = mapDbProduct(dbProduct)
    expect(result.milestones).toHaveLength(1)
    expect(result.milestones[0].name).toBe('Beta launch')
    expect(result.milestones[0].startDate).toBeInstanceOf(Date)
  })

  it('returns empty milestones when undefined', () => {
    const result = mapDbProduct({ ...dbProduct, milestones: undefined })
    expect(result.milestones).toEqual([])
  })

  it('maps createdBy user reference', () => {
    const result = mapDbProduct(dbProduct)
    expect(result.createdBy?.name).toBe('Ana García')
    expect(result.createdBy?.email).toBe('test@example.com')
  })

  it('returns undefined for null updatedBy', () => {
    const result = mapDbProduct(dbProduct)
    expect(result.updatedBy).toBeUndefined()
  })

  it('uses fallback color when card_color is null', () => {
    const result = mapDbProduct({ ...dbProduct, card_color: null })
    expect(result.cardColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})
