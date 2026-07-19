import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { hashPassword, verifyPassword } from '../_lib/auth'
import { requireAuth } from '../_lib/requireAuth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireAuth(req)
  if (!session) return res.status(401).json({ error: 'No autenticado' })
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' })

  const { currentPassword, newPassword } = req.body ?? {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Falta la contraseña actual o la nueva' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' })
  }

  const { rows } = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [session.uid])
  const usuario = rows[0]
  if (!usuario || !verifyPassword(currentPassword, usuario.password_hash)) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
  }

  await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashPassword(newPassword), session.uid])
  return res.status(200).json({ ok: true })
}
