import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'No autenticado' })
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Método no permitido' })

  const { tarifaId, tipoHabitacion, pax, montoActual, montoPropuesto } = req.body ?? {}
  if (!tarifaId || !tipoHabitacion || !pax) {
    return res.status(400).json({ error: 'Falta tarifaId, tipoHabitacion o pax' })
  }
  for (const [campo, monto] of [['montoActual', montoActual], ['montoPropuesto', montoPropuesto]] as const) {
    if (monto !== null && monto !== undefined && (typeof monto !== 'number' || monto <= 0)) {
      return res.status(400).json({ error: `${campo} debe ser un número positivo, o null para N/A` })
    }
  }

  const { rows: th } = await pool.query('SELECT id FROM tipos_habitacion WHERE nombre = $1', [tipoHabitacion])
  if (!th[0]) return res.status(400).json({ error: `Tipo de habitación desconocido: ${tipoHabitacion}` })

  await pool.query(
    `INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual, monto_propuesto)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (tarifa_id, tipo_habitacion_id, pax)
     DO UPDATE SET monto_actual = $4, monto_propuesto = $5`,
    [tarifaId, th[0].id, pax, montoActual ?? null, montoPropuesto ?? null],
  )
  return res.status(200).json({ ok: true })
}
