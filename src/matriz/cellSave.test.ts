import { describe, expect, it } from 'vitest'
import { resolveSiblingOverride } from './cellSave'

describe('resolveSiblingOverride', () => {
  it('editing montoActual preserves a null override as null (regression case)', () => {
    expect(resolveSiblingOverride('montoActual', 1500, { montoPropuestoOverride: null })).toBeNull()
  })

  it('editing montoActual preserves an existing non-null override unchanged', () => {
    expect(resolveSiblingOverride('montoActual', 1500, { montoPropuestoOverride: 2200 })).toBe(2200)
  })

  it('editing montoActual with no existing cell (actual === null) yields null', () => {
    expect(resolveSiblingOverride('montoActual', 1500, null)).toBeNull()
  })

  it('editing montoPropuesto directly sends the new typed value as the override', () => {
    expect(resolveSiblingOverride('montoPropuesto', 1800, { montoPropuestoOverride: null })).toBe(1800)
  })

  it('editing montoPropuesto to blank sends null as the override', () => {
    expect(resolveSiblingOverride('montoPropuesto', null, { montoPropuestoOverride: 2200 })).toBeNull()
  })
})
