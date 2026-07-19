import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db.js'
import { requireAuth } from '../_lib/requireAuth.js'
import { buildTarifasJson, buildTarifasCotizadorJson, type TarifaConValores } from '../_lib/exportFormats.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'No autenticado' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { edicionId } = req.body ?? {}
  if (!edicionId) return res.status(400).json({ error: 'Falta edicionId' })

  const { rows: edicionRows } = await pool.query('SELECT anio FROM ediciones WHERE id = $1', [edicionId])
  if (!edicionRows[0]) return res.status(404).json({ error: 'Edición no encontrada' })
  const anio = edicionRows[0].anio

  const { rows: tarifas } = await pool.query('SELECT id, nombre FROM tarifas WHERE edicion_id = $1', [edicionId])
  const ids = tarifas.map((t) => t.id)

  const [{ rows: valores }, { rows: extras }] = await Promise.all([
    pool.query(
      `SELECT tv.tarifa_id, th.nombre AS tipo_habitacion, tv.pax, tv.monto_actual
       FROM tarifa_valores tv JOIN tipos_habitacion th ON th.id = tv.tipo_habitacion_id
       WHERE tv.tarifa_id = ANY($1)`,
      [ids],
    ),
    pool.query(
      `SELECT tpe.tarifa_id, th.nombre AS tipo_habitacion, tpe.monto_actual
       FROM tarifa_persona_extra tpe JOIN tipos_habitacion th ON th.id = tpe.tipo_habitacion_id
       WHERE tpe.tarifa_id = ANY($1)`,
      [ids],
    ),
  ])

  const tarifasConValores: TarifaConValores[] = tarifas.map((t) => ({
    nombre: t.nombre,
    valores: valores
      .filter((v) => v.tarifa_id === t.id)
      .map((v) => ({
        tipoHabitacion: v.tipo_habitacion,
        pax: v.pax,
        montoActual: v.monto_actual === null ? null : Number(v.monto_actual),
      })),
    personaExtra: extras
      .filter((e) => e.tarifa_id === t.id)
      .map((e) => ({ tipoHabitacion: e.tipo_habitacion, montoActual: e.monto_actual === null ? null : Number(e.monto_actual) })),
  }))

  const tarifasJson = buildTarifasJson(anio, tarifasConValores)
  const tarifasCotizadorJson = buildTarifasCotizadorJson(tarifasConValores)

  await pool.query(`UPDATE ediciones SET estado = 'activa', fecha_publicacion = now() WHERE id = $1`, [edicionId])

  return res.status(200).json({ tarifasJson, tarifasCotizadorJson })
}
