export type CampoTarifa = 'montoActual' | 'montoPropuesto'

export interface CeldaConOverride {
  montoPropuestoOverride: number | null
}

/**
 * Decide qué valor RAW debe viajar como `montoPropuesto` en el PUT cuando se guarda
 * una celda. Editar `montoPropuesto` directamente fija un nuevo override. Editar
 * `montoActual` NO debe tocar el override existente — hay que reenviar el override
 * crudo (no el valor ya calculado por la fórmula), o si no había override, `null`,
 * para que la fórmula de aumento siga recalculando esa celda.
 */
export function resolveSiblingOverride(
  campo: CampoTarifa,
  nuevoMonto: number | null,
  actual: CeldaConOverride | null,
): number | null {
  if (campo === 'montoPropuesto') return nuevoMonto
  return actual?.montoPropuestoOverride ?? null
}
