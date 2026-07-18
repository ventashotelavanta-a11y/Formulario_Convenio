import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireAuth(req)
  if (!session) return res.status(401).json({ error: 'No autenticado' })

  const { rows } = await pool.query('SELECT nombre, email FROM usuarios WHERE id = $1', [session.uid])
  if (!rows[0]) return res.status(401).json({ error: 'No autenticado' })
  return res.status(200).json(rows[0])
}
