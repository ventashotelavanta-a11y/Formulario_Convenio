import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'
import { computeMontoPropuesto } from '../_lib/matrizCalc'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'No autenticado' })

  if (req.method === 'GET') {
    const edicionId = Number(req.query.edicionId)
    if (!edicionId) return res.status(400).json({ error: 'Falta edicionId' })

    const { rows: tarifas } = await pool.query(
      `SELECT id, nombre, vigencia_desde, vigencia_hasta FROM tarifas WHERE edicion_id = $1 ORDER BY nombre`,
      [edicionId],
    )
    const ids = tarifas.map((t) => t.id)
    if (ids.length === 0) return res.status(200).json([])

    const [{ rows: canales }, { rows: valores }, { rows: extras }, { rows: edicionRows }] = await Promise.all([
      pool.query(
        `SELECT tc.tarifa_id, c.nombre FROM tarifa_canales tc JOIN canales_venta c ON c.id = tc.canal_id WHERE tc.tarifa_id = ANY($1)`,
        [ids],
      ),
      pool.query(
        `SELECT tv.tarifa_id, th.nombre AS tipo_habitacion, tv.pax, tv.monto_actual, tv.monto_propuesto
         FROM tarifa_valores tv JOIN tipos_habitacion th ON th.id = tv.tipo_habitacion_id
         WHERE tv.tarifa_id = ANY($1)`,
        [ids],
      ),
      pool.query(
        `SELECT tpe.tarifa_id, th.nombre AS tipo_habitacion, tpe.monto_actual, tpe.monto_propuesto
         FROM tarifa_persona_extra tpe JOIN tipos_habitacion th ON th.id = tpe.tipo_habitacion_id
         WHERE tpe.tarifa_id = ANY($1)`,
        [ids],
      ),
      pool.query('SELECT aumento_default_mxn FROM ediciones WHERE id = $1', [edicionId]),
    ])
    const aumentoDefault = edicionRows[0] ? Number(edicionRows[0].aumento_default_mxn) : 0

    const result = tarifas.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      vigenciaDesde: t.vigencia_desde,
      vigenciaHasta: t.vigencia_hasta,
      canales: canales.filter((c) => c.tarifa_id === t.id).map((c) => c.nombre),
      valores: valores
        .filter((v) => v.tarifa_id === t.id)
        .map((v) => {
          const montoActual = v.monto_actual === null ? null : Number(v.monto_actual)
          const overrideDb = v.monto_propuesto === null ? null : Number(v.monto_propuesto)
          return {
            tipoHabitacion: v.tipo_habitacion,
            pax: v.pax,
            montoActual,
            montoPropuesto: computeMontoPropuesto(montoActual, aumentoDefault, overrideDb),
          }
        }),
      // ponytail: same NULL-fallback as `valores` above — el spec dice "todas las celdas
      // sin override manual", y persona_extra es una celda mas con la misma columna monto_propuesto.
      personaExtra: extras
        .filter((e) => e.tarifa_id === t.id)
        .map((e) => {
          const montoActual = e.monto_actual === null ? null : Number(e.monto_actual)
          const overrideDb = e.monto_propuesto === null ? null : Number(e.monto_propuesto)
          return {
            tipoHabitacion: e.tipo_habitacion,
            montoActual,
            montoPropuesto: computeMontoPropuesto(montoActual, aumentoDefault, overrideDb),
          }
        }),
    }))

    return res.status(200).json(result)
  }

  if (req.method === 'POST') {
    const { edicionId, nombre, canalIds, vigenciaDesde, vigenciaHasta } = req.body ?? {}
    if (!edicionId || !nombre || !Array.isArray(canalIds) || canalIds.length === 0) {
      return res.status(400).json({ error: 'Falta edicionId, nombre o canalIds' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        `INSERT INTO tarifas (edicion_id, nombre, vigencia_desde, vigencia_hasta) VALUES ($1,$2,$3,$4) RETURNING id`,
        [edicionId, nombre.trim(), vigenciaDesde ?? null, vigenciaHasta ?? null],
      )
      const tarifaId = rows[0].id
      for (const canalId of canalIds) {
        await client.query('INSERT INTO tarifa_canales (tarifa_id, canal_id) VALUES ($1,$2)', [tarifaId, canalId])
      }
      await client.query('COMMIT')
      return res.status(201).json({ id: tarifaId })
    } catch (err) {
      await client.query('ROLLBACK')
      return res.status(500).json({ error: 'No se pudo crear la tarifa' })
    } finally {
      client.release()
    }
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
