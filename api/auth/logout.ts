import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SESSION_COOKIE_NAME } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`)
  return res.status(200).json({ ok: true })
}
