import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'No autenticado' })

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      `SELECT id, anio, estado, aumento_default_mxn, fecha_publicacion FROM ediciones ORDER BY anio DESC`,
    )
    return res.status(200).json(
      rows.map((r) => ({
        id: r.id,
        anio: r.anio,
        estado: r.estado,
        aumentoDefaultMxn: Number(r.aumento_default_mxn),
        fechaPublicacion: r.fecha_publicacion,
      })),
    )
  }

  if (req.method === 'PUT') {
    const { id, aumentoDefaultMxn } = req.body ?? {}
    if (!id || typeof aumentoDefaultMxn !== 'number') {
      return res.status(400).json({ error: 'Falta id o aumentoDefaultMxn' })
    }
    await pool.query('UPDATE ediciones SET aumento_default_mxn = $1 WHERE id = $2', [aumentoDefaultMxn, id])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
