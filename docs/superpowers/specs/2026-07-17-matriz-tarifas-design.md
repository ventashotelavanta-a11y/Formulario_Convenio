# Matriz de Tarifas — Design Spec

**Fecha:** 2026-07-17
**Autor:** Ricardo Peña Covarrubias (con Claude)

## Contexto

Avanta Hotel & Villas presenta sus tarifas a clientes/canales en tablas de Excel/imagen
armadas manualmente (ver `AVANTA HOTEL`/capturas). Cada tabla ("módulo") corresponde a
una tarifa comercial (ej. "Direct Booking Sin Desayuno", "Convenio Avanta Con Desayuno
Buffet") con precios por tipo de habitación y número de personas. Actualizar precios,
armar una propuesta de aumento, y llevar historial de años anteriores hoy es 100% manual.

Este spec cubre un dashboard interno ("Matriz de Tarifas") para:
1. Editar la matriz de tarifas vigente.
2. Ver/editar una propuesta de aumento (aumento global editable + ajustes por celda).
3. Publicar una edición (congela valores, exporta el JSON que ya consume
   `convenios-avanta-2026/api`, y genera un PDF presentable de la propuesta).
4. Consultar ediciones anteriores (historial de años).

## Fuera de alcance (YAGNI por ahora)

- Multi-usuario con roles/permisos — un solo usuario (Ricardo) edita.
- Integración automática con los cotizadores (`cotizacion-avanta`,
  `cotizacion-sala-nova`) — el JSON exportado queda listo para que esos repos lo
  consuman como hoy, pero conectarlos es trabajo aparte si se pide.
- Traducción/i18n — español mexicano únicamente.

## Arquitectura

- **Frontend:** nueva ruta `/matriz-tarifas` dentro del repo `Formulario_Convenio`
  (React 18 + TypeScript + Vite + Tailwind, mismo stack y deploy de Vercel ya existente).
- **API:** carpeta `api/` (Vercel Serverless Functions, Node/TS) para el CRUD contra
  Postgres.
- **Exportación PDF:** función serverless en Python + ReportLab (mismo patrón que el
  resto de generación de PDFs de Avanta), reutilizando la fuente Kodchasan-Medium ya
  incluida en el repo.
- **Base de datos:** Postgres nuevo (`avanta-db`) en EasyPanel, mismo patrón que
  `promosolution-db`. Es la fuente de verdad; el JSON para `convenios-avanta-2026` se
  genera a partir de ella al publicar una edición, no al revés.
- **Autenticación:** contraseña única compartida (variable de entorno + cookie de
  sesión firmada). Proporcional a que hoy solo un usuario administra precios; si más
  gente necesita editar en el futuro, se puede migrar a OAuth sin rediseñar el resto.

## Modelo de datos (Postgres)

```
ediciones
  id, anio, estado ('borrador' | 'activa' | 'archivada'),
  aumento_default_mxn, fecha_publicacion

canales_venta          -- catálogo, editable desde el dashboard
  id, nombre
  seed: Direct Booking, Walk-In, Reservas, Extranet, OTA's, Convenios,
        Campañas RRSS, Demand Plus, Airbnb

secciones              -- catálogo
  id, nombre            -- Hotel, Villas

tipos_habitacion       -- catálogo
  id, seccion_id, nombre, camas_descripcion, capacidad_personas
  seed: Sencilla King Hotel (1 cama King, cap. 3)
        Doble Queen Hotel (2 camas Queen, cap. 5)
        Sencilla King Villas (1 cama King, cap. 3)
        Doble Queen Villas (2 camas Queen, cap. 5)

tarifas                -- un módulo/card en el dashboard (botón "+" crea una fila aquí)
  id, edicion_id, nombre, vigencia_desde, vigencia_hasta

tarifa_canales         -- N:M — un módulo puede aplicar a varios canales
  tarifa_id, canal_id

tarifa_valores         -- celdas de la matriz tipo_habitación × pax
  tarifa_id, tipo_habitacion_id, pax (1-4), monto_actual, monto_propuesto
  -- monto_propuesto NULL => se calcula como monto_actual + aumento_default de la
  -- edición; se puede sobreescribir celda por celda.

tarifa_persona_extra    -- costo del huésped que excede las 4 columnas de pax
  tarifa_id, tipo_habitacion_id, monto_actual, monto_propuesto
  -- solo aplica a tipos de habitación con capacidad_personas > 4
```

## Datos semilla (edición 2026, estado "borrador")

10 módulos con valores ya confirmados por Ricardo, todos con aumento_default = $80 MXN:

| Tarifa | Canal(es) |
|---|---|
| Sin Convenio Sin Desayuno | Direct Booking, Walk-In, Reservas, Extranet |
| Sin Convenio Con Desayuno Buffet | Direct Booking, Walk-In, Reservas, Extranet |
| Sin Convenio Con Desayuno Americano | Direct Booking, Walk-In, Reservas, Extranet |
| OTA's 0 a 50% Sin Desayuno | OTA's |
| OTA's 50 a 100% Sin Desayuno | OTA's |
| OTA's 0 a 50% Con Desayuno Buffet (solo Hotel) | OTA's |
| OTA's 50 a 100% Con Desayuno Buffet (solo Hotel) | OTA's |
| Convenio Avanta Sin Desayuno | Convenios |
| Convenio Avanta Con Desayuno Buffet | Convenios |
| Convenio Avanta Con Desayuno Americano | Convenios |

Las tarifas de OTA's con desayuno buffet no tienen celdas de Villas ni persona extra
capturadas todavía — quedan en blanco (`NULL`) para llenarse desde el dashboard.
Campañas RRSS, Demand Plus y Airbnb no tienen módulos aún; se agregan con "+" cuando
Ricardo tenga los valores.

## Flujos principales

1. **Matriz actual** — pantalla principal: grid de cards, una por tarifa, agrupables/
   filtrables por canal. Cada card es una tabla editable (tipo habitación × pax +
   persona extra). Guardar escribe directo a Postgres (autosave o botón guardar, a
   definir en el plan de implementación).
2. **Agregar módulo ("+")** — crea una fila en `tarifas`, pide nombre + canal(es) +
   vigencia; las celdas empiezan vacías para llenarse a mano.
3. **Propuesta de aumento** — misma vista de cada card, pero con columnas "actual" y
   "propuesta" lado a lado (como el screenshot original). Campo global de aumento
   (default $80, editable) recalcula `monto_propuesto` de todas las celdas sin override
   manual.
4. **Publicar edición** — cambia `estado` a `activa`, congela valores, genera:
   - el `tarifas.json` en el formato que ya lee `convenios-avanta-2026/api`
   - un PDF de la propuesta (estilo mejorado del screenshot original) vía la función
     Python/ReportLab
5. **Historial de ediciones** — lista de años pasados en solo lectura.

## Validación / errores

- Montos deben ser numéricos positivos; N/A es un valor explícito distinto de 0.
- `capacidad_personas` de cada tipo de habitación determina qué columnas de pax están
  habilitadas (ej. Sencilla King solo permite 1-3 pax, columna 4 deshabilitada).
- No se puede publicar una edición con celdas obligatorias vacías sin confirmación
  explícita (advertencia, no bloqueo duro — Ricardo puede publicar con huecos a
  propósito si un canal no aplica).

## UI / diseño visual

Al pasar a implementación de las pantallas, se invocan `huashu-design`,
`ui-ux-pro-max` y `emil-design-eng` (regla obligatoria del proyecto para trabajo de
interfaz) para definir estilo visual, paleta y micro-interacciones de las cards y la
vista comparativa — no antes, este spec solo define estructura y datos.

## Testing

- Un test de humo por endpoint API (crear tarifa, editar celda, calcular propuesta con
  aumento_default, publicar edición → JSON generado tiene la forma esperada).
- Caso límite: tipo de habitación con capacidad 3 no debe generar columna de 4 pax en
  el JSON exportado.
