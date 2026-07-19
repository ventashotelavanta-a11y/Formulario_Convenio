import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db.js'
import { requireAuth } from '../_lib/requireAuth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'No autenticado' })
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' })

  const { tarifaId, tipoHabitacion, montoActual, montoPropuesto } = req.body ?? {}
  if (!tarifaId || !tipoHabitacion) {
    return res.status(400).json({ error: 'Falta tarifaId o tipoHabitacion' })
  }
  for (const [campo, monto] of [['montoActual', montoActual], ['montoPropuesto', montoPropuesto]] as const) {
    if (monto !== null && monto !== undefined && (typeof monto !== 'number' || monto <= 0)) {
      return res.status(400).json({ error: `${campo} debe ser un número positivo, o null para N/A` })
    }
  }

  const { rows: th } = await pool.query('SELECT id, capacidad_personas FROM tipos_habitacion WHERE nombre = $1', [
    tipoHabitacion,
  ])
  if (!th[0]) return res.status(400).json({ error: `Tipo de habitación desconocido: ${tipoHabitacion}` })
  if (th[0].capacidad_personas <= 4) {
    return res.status(400).json({ error: 'Este tipo de habitación no admite persona extra' })
  }

  try {
    await pool.query(
      `INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual, monto_propuesto)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (tarifa_id, tipo_habitacion_id)
       DO UPDATE SET monto_actual = $3, monto_propuesto = $4`,
      [tarifaId, th[0].id, montoActual ?? null, montoPropuesto ?? null],
    )
    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo guardar la tarifa de persona extra' })
  }
}
