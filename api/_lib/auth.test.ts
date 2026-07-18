import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signSession, verifySession } from './auth'

describe('password hashing', () => {
  it('verifies a correct password', () => {
    const stored = hashPassword('mi-clave-segura')
    expect(verifyPassword('mi-clave-segura', stored)).toBe(true)
  })

  it('rejects an incorrect password', () => {
    const stored = hashPassword('mi-clave-segura')
    expect(verifyPassword('otra-clave', stored)).toBe(false)
  })
})

describe('session signing', () => {
  it('round-trips a valid session', () => {
    const token = signSession({ uid: 7 })
    expect(verifySession(token)).toEqual({ uid: 7 })
  })

  it('rejects a tampered token', () => {
    const token = signSession({ uid: 7 })
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(verifySession(tampered)).toBeNull()
  })
})
