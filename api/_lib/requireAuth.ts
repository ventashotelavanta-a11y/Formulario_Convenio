import type { VercelRequest } from '@vercel/node'
import { verifySession, SESSION_COOKIE_NAME } from './auth.js'

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k) out[k] = decodeURIComponent(v.join('='))
  }
  return out
}

export function requireAuth(req: VercelRequest): { uid: number } | null {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies[SESSION_COOKIE_NAME]
  if (!token) return null
  return verifySession(token)
}
