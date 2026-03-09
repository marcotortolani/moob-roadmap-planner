import { describe, it, expect } from 'vitest'
import {
  isBusinessDay,
  addBusinessDays,
  subtractBusinessDays,
  countBusinessDays,
  getNextBusinessDay,
  getPreviousBusinessDay,
} from '../business-days'
import type { Holiday } from '../types'

// Monday 2026-03-09
const MONDAY = new Date('2026-03-09T12:00:00')
// Tuesday 2026-03-10
const TUESDAY = new Date('2026-03-10T12:00:00')
// Saturday 2026-03-14
const SATURDAY = new Date('2026-03-14T12:00:00')
// Sunday 2026-03-15
const SUNDAY = new Date('2026-03-15T12:00:00')

const NO_HOLIDAYS: Holiday[] = []
const WITH_HOLIDAY: Holiday[] = [
  { id: '1', name: 'Test Holiday', date: new Date('2026-03-10T00:00:00') },
]

describe('isBusinessDay', () => {
  it('returns true for Monday with no holidays', () => {
    expect(isBusinessDay(MONDAY, NO_HOLIDAYS)).toBe(true)
  })

  it('returns false for Saturday', () => {
    expect(isBusinessDay(SATURDAY, NO_HOLIDAYS)).toBe(false)
  })

  it('returns false for Sunday', () => {
    expect(isBusinessDay(SUNDAY, NO_HOLIDAYS)).toBe(false)
  })

  it('returns false for a weekday that is a holiday', () => {
    expect(isBusinessDay(TUESDAY, WITH_HOLIDAY)).toBe(false)
  })

  it('returns true for Tuesday when it is not a holiday', () => {
    expect(isBusinessDay(TUESDAY, NO_HOLIDAYS)).toBe(true)
  })
})

describe('addBusinessDays', () => {
  it('throws for negative count', () => {
    expect(() => addBusinessDays(MONDAY, -1, NO_HOLIDAYS)).toThrow()
  })

  it('returns same date for count=0', () => {
    expect(addBusinessDays(MONDAY, 0, NO_HOLIDAYS)).toEqual(MONDAY)
  })

  it('adds 1 business day from Monday → Tuesday', () => {
    const result = addBusinessDays(MONDAY, 1, NO_HOLIDAYS)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-10')
  })

  it('skips weekend: adds 1 business day from Friday → Monday', () => {
    const friday = new Date('2026-03-13T12:00:00')
    const result = addBusinessDays(friday, 1, NO_HOLIDAYS)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-16')
  })

  it('skips holiday when adding business days', () => {
    // Monday + 1 business day, but Tuesday is a holiday → next is Wednesday
    const result = addBusinessDays(MONDAY, 1, WITH_HOLIDAY)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-11')
  })
})

describe('subtractBusinessDays', () => {
  it('throws for negative count', () => {
    expect(() => subtractBusinessDays(MONDAY, -1, NO_HOLIDAYS)).toThrow()
  })

  it('returns same date for count=0', () => {
    expect(subtractBusinessDays(MONDAY, 0, NO_HOLIDAYS)).toEqual(MONDAY)
  })

  it('subtracts 1 business day from Tuesday → Monday', () => {
    const result = subtractBusinessDays(TUESDAY, 1, NO_HOLIDAYS)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-09')
  })

  it('skips weekend: subtracts 1 business day from Monday → Friday', () => {
    const result = subtractBusinessDays(MONDAY, 1, NO_HOLIDAYS)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-06')
  })
})

describe('countBusinessDays', () => {
  it('returns 0 when start is after end', () => {
    expect(countBusinessDays(TUESDAY, MONDAY, NO_HOLIDAYS)).toBe(0)
  })

  it('counts 1 for same day that is a business day', () => {
    expect(countBusinessDays(MONDAY, MONDAY, NO_HOLIDAYS)).toBe(1)
  })

  it('counts 0 for Saturday', () => {
    expect(countBusinessDays(SATURDAY, SATURDAY, NO_HOLIDAYS)).toBe(0)
  })

  it('counts 5 business days in a full work week', () => {
    const monday = new Date('2026-03-09T12:00:00')
    const friday = new Date('2026-03-13T12:00:00')
    expect(countBusinessDays(monday, friday, NO_HOLIDAYS)).toBe(5)
  })

  it('excludes holidays from count', () => {
    const monday = new Date('2026-03-09T12:00:00')
    const friday = new Date('2026-03-13T12:00:00')
    // Tuesday is a holiday, so Mon-Fri has 4 business days
    expect(countBusinessDays(monday, friday, WITH_HOLIDAY)).toBe(4)
  })
})

describe('getNextBusinessDay', () => {
  it('returns next weekday from Friday', () => {
    const friday = new Date('2026-03-13T12:00:00')
    const result = getNextBusinessDay(friday, NO_HOLIDAYS)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-16')
  })

  it('skips holiday to get next business day', () => {
    // Tuesday is holiday, so next from Monday is Wednesday
    const result = getNextBusinessDay(MONDAY, WITH_HOLIDAY)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-11')
  })
})

describe('getPreviousBusinessDay', () => {
  it('returns previous weekday from Monday', () => {
    const result = getPreviousBusinessDay(MONDAY, NO_HOLIDAYS)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-06')
  })

  it('skips holiday to get previous business day', () => {
    // Tuesday is holiday, so previous from Wednesday is Monday
    const wednesday = new Date('2026-03-11T12:00:00')
    const result = getPreviousBusinessDay(wednesday, WITH_HOLIDAY)
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-09')
  })
})
