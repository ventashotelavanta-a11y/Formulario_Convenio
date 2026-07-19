import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { hashPassword, verifyPassword, signSession, SESSION_COOKIE_NAME } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { email, password } = req.body ?? {}
  if (!email || !password) return res.status(400).json({ error: 'Falta email o contraseña' })

  const { rows } = await pool.query('SELECT id, password_hash FROM usuarios WHERE email = $1', [email])
  const usuario = rows[0]
  if (!usuario) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }

  if (usuario.password_hash === null) {
    // Cuenta sin contraseña asignada: la primera contraseña enviada se guarda como definitiva.
    if (password.length < 8) {
      return res.status(400).json({ error: 'Tu primera contraseña debe tener al menos 8 caracteres' })
    }
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hashPassword(password), usuario.id])
  } else if (!verifyPassword(password, usuario.password_hash)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }

  const token = signSession({ uid: usuario.id })
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
  )
  return res.status(200).json({ ok: true })
}
