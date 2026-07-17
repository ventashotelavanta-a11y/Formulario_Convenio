import { describe, it, expect } from 'vitest'
import { computeMontoPropuesto, paxColumnasPermitidas } from './matrizCalc'

describe('computeMontoPropuesto', () => {
  it('adds the default increase when there is no override', () => {
    expect(computeMontoPropuesto(850, 80, null)).toBe(930)
  })

  it('returns the override untouched when present', () => {
    expect(computeMontoPropuesto(850, 80, 999)).toBe(999)
  })

  it('returns null when the current amount is null (N/A cell)', () => {
    expect(computeMontoPropuesto(null, 80, null)).toBeNull()
  })
})

describe('paxColumnasPermitidas', () => {
  it('limits capacity-3 rooms to pax 1-3', () => {
    expect(paxColumnasPermitidas(3)).toEqual([1, 2, 3])
  })

  it('limits capacity-5 rooms to pax 1-4 in the grid (5th pax is persona_extra)', () => {
    expect(paxColumnasPermitidas(5)).toEqual([1, 2, 3, 4])
  })
})
