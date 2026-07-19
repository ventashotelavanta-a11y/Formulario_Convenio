import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'No autenticado' })

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT id, nombre FROM canales_venta ORDER BY nombre')
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { nombre } = req.body ?? {}
    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({ error: 'El canal necesita un nombre' })
    }
    const { rows } = await pool.query(
      'INSERT INTO canales_venta (nombre) VALUES ($1) RETURNING id, nombre',
      [nombre.trim()],
    )
    return res.status(201).json(rows[0])
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
