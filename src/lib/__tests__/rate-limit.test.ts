import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit } from '../rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('allows requests within the limit', () => {
    const config = { limit: 3, windowMs: 60_000 }
    const key = `test:${Date.now()}`

    const r1 = checkRateLimit(key, config)
    const r2 = checkRateLimit(key, config)
    const r3 = checkRateLimit(key, config)

    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests over the limit', () => {
    const config = { limit: 2, windowMs: 60_000 }
    const key = `test:${Date.now()}:block`

    checkRateLimit(key, config)
    checkRateLimit(key, config)
    const r3 = checkRateLimit(key, config)

    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
    expect(r3.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets after the window expires', () => {
    const config = { limit: 1, windowMs: 1_000 }
    const key = `test:${Date.now()}:reset`

    checkRateLimit(key, config) // use up the limit
    const blocked = checkRateLimit(key, config)
    expect(blocked.allowed).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(1_500)

    const afterReset = checkRateLimit(key, config)
    expect(afterReset.allowed).toBe(true)
  })

  it('tracks separate keys independently', () => {
    const config = { limit: 1, windowMs: 60_000 }
    const base = `test:${Date.now()}:separate`

    checkRateLimit(`${base}:a`, config)
    checkRateLimit(`${base}:a`, config)

    const b = checkRateLimit(`${base}:b`, config)
    expect(b.allowed).toBe(true)
  })
})
