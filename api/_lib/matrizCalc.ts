export function computeMontoPropuesto(
  montoActual: number | null,
  aumentoDefault: number,
  override: number | null,
): number | null {
  if (override !== null) return override
  if (montoActual === null) return null
  return montoActual + aumentoDefault
}

export function paxColumnasPermitidas(capacidadPersonas: number): number[] {
  const maxColumna = Math.min(capacidadPersonas, 4)
  return Array.from({ length: maxColumna }, (_, i) => i + 1)
}
