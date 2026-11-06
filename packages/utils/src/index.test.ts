import { describe, it, expect } from 'vitest'
import { computeProgress, formatDate } from './index'

describe('utils', () => {
  it('computes progress correctly', () => {
    expect(computeProgress(3, 4)).toBe(75)
    expect(computeProgress(0, 10)).toBe(0)
    expect(computeProgress(5, 5)).toBe(100)
  })

  it('returns 0 when total is 0', () => {
    expect(computeProgress(0, 0)).toBe(0)
  })

  it('formats date', () => {
    expect(formatDate(null)).toBe('—')
  })
})
