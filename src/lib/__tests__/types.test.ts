import { describe, it, expect } from 'vitest'
import { ProductSchema, MilestoneSchema, CustomUrlSchema, Status, MilestoneStatus } from '../types'

const validMilestone = {
  name: 'Launch',
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-31'),
  status: MilestoneStatus.PENDING,
}

const validProduct = {
  name: 'Test Product',
  operator: 'Operator A',
  country: 'ES',
  language: 'es-ES',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-12-31'),
  productiveUrl: '',
  vercelDemoUrl: '',
  wpContentProdUrl: '',
  wpContentTestUrl: '',
  chatbotUrl: '',
  cardColor: '#778899',
  status: Status.PLANNED,
}

describe('MilestoneSchema', () => {
  it('validates a correct milestone', () => {
    const result = MilestoneSchema.safeParse(validMilestone)
    expect(result.success).toBe(true)
  })

  it('fails when name is empty', () => {
    const result = MilestoneSchema.safeParse({ ...validMilestone, name: '' })
    expect(result.success).toBe(false)
  })

  it('fails when endDate is before startDate', () => {
    const result = MilestoneSchema.safeParse({
      ...validMilestone,
      startDate: new Date('2026-03-31'),
      endDate: new Date('2026-03-01'),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('endDate')
    }
  })

  it('accepts optional id field', () => {
    const result = MilestoneSchema.safeParse({ ...validMilestone, id: 'some-id' })
    expect(result.success).toBe(true)
  })
})

describe('CustomUrlSchema', () => {
  it('validates a correct custom URL', () => {
    const result = CustomUrlSchema.safeParse({ label: 'Docs', url: 'https://example.com' })
    expect(result.success).toBe(true)
  })

  it('fails with empty label', () => {
    const result = CustomUrlSchema.safeParse({ label: '', url: 'https://example.com' })
    expect(result.success).toBe(false)
  })

  it('fails with invalid URL', () => {
    const result = CustomUrlSchema.safeParse({ label: 'Docs', url: 'not-a-url' })
    expect(result.success).toBe(false)
  })
})

describe('ProductSchema', () => {
  it('validates a correct product', () => {
    const result = ProductSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
  })

  it('fails when name is empty', () => {
    const result = ProductSchema.safeParse({ ...validProduct, name: '' })
    expect(result.success).toBe(false)
  })

  it('fails when operator is empty', () => {
    const result = ProductSchema.safeParse({ ...validProduct, operator: '' })
    expect(result.success).toBe(false)
  })

  it('fails with invalid country code', () => {
    const result = ProductSchema.safeParse({ ...validProduct, country: 'XX' })
    expect(result.success).toBe(false)
  })

  it('fails when endDate is before startDate', () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      startDate: new Date('2026-12-31'),
      endDate: new Date('2026-01-01'),
    })
    expect(result.success).toBe(false)
  })

  it('fails with invalid hex color', () => {
    const result = ProductSchema.safeParse({ ...validProduct, cardColor: 'blue' })
    expect(result.success).toBe(false)
  })

  it('accepts valid 6-digit hex color', () => {
    const result = ProductSchema.safeParse({ ...validProduct, cardColor: '#FF6B6B' })
    expect(result.success).toBe(true)
  })

  it('trims whitespace from name', () => {
    const result = ProductSchema.safeParse({ ...validProduct, name: '  My Product  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('My Product')
    }
  })

  it('validates with milestones array', () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      milestones: [validMilestone],
    })
    expect(result.success).toBe(true)
  })

  it('fails when a milestone is invalid', () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      milestones: [{ ...validMilestone, name: '' }],
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid status values', () => {
    for (const status of Object.values(Status)) {
      const result = ProductSchema.safeParse({ ...validProduct, status })
      expect(result.success).toBe(true)
    }
  })
})
