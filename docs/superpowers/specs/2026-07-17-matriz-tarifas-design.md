# Matriz de Tarifas — Design Spec

**Fecha:** 2026-07-17
**Autor:** Ricardo Peña Covarrubias (con Claude)

## Contexto

Avanta Hotel & Villas presenta sus tarifas a la gerencia del hotel, a su personal, y
las sube a los diferentes canales de venta para clientes, en tablas de Excel/imagen
armadas manualmente (ver `AVANTA HOTEL`/capturas). Cada tabla ("módulo") corresponde a
una tarifa comercial (ej. "Direct Booking Sin Desayuno", "Convenio Avanta Con Desayuno
Buffet") con precios por tipo de habitación y número de personas. Actualizar precios,
armar una propuesta de aumento, y llevar historial de años anteriores hoy es 100% manual.

Este spec cubre un dashboard interno ("Matriz de Tarifas") para:
1. Editar la matriz de tarifas vigente — incluyendo agregar canales y tarifas nuevas
   con un botón "+", no solo editar precios de módulos ya existentes.
2. Ver/editar una propuesta de aumento (aumento global editable + ajustes por celda).
3. Publicar una edición (congela valores y genera los archivos que consumen los repos
   de cotizadores/convenios — ver "Exportación", más abajo — y un PDF presentable de
   la propuesta).
4. Consultar ediciones anteriores (historial de años).

## Fuera de alcance (YAGNI por ahora)

- Roles/permisos diferenciados — 2 usuarios (Ricardo e Isabel), mismos permisos para
  ambos, sin sistema de roles.
- Push automático (PR/commit) hacia `convenios-avanta-2026` o `cotizacion-avanta` —
  el dashboard genera los archivos con el formato correcto; colocarlos en el repo y
  desplegar sigue siendo manual (lo hace Ricardo), como hoy.
- Cambios a `cotizacion-sala-nova` — es un producto distinto (renta de salón/coffee
  break), no tiene relación con las tarifas de habitación.
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
- **Autenticación:** 2 cuentas fijas (Ricardo, Isabel), mismos permisos, sin sistema de
  roles — usuario/contraseña simple contra una tabla `usuarios` en Postgres + cookie de
  sesión firmada. Si se necesitan más cuentas o roles diferenciados a futuro, se agrega
  sin rediseñar el resto.

## Modelo de datos (Postgres)

```
usuarios               -- 2 filas semilla: Ricardo, Isabel — mismos permisos
  id, nombre, email, password_hash

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
4. **Publicar edición** — cambia `estado` a `activa`, congela valores, genera los
   archivos descritos en "Exportación" y un PDF de la propuesta (estilo mejorado del
   screenshot original) vía la función Python/ReportLab. Ricardo descarga y coloca cada
   archivo en el repo correspondiente manualmente (sin push automático).
5. **Historial de ediciones** — lista de años pasados en solo lectura.

## Exportación — consumidores downstream

El dashboard es la fuente de verdad; al publicar una edición genera dos archivos
distintos, uno por repo consumidor (ambos formatos ya existentes, sin inventar uno
nuevo):

1. **`tarifas.json`** — formato plano de 6 claves que ya lee
   `convenios-avanta-2026/api/generar-convenio-pdf.py` (King/Queen × Sin Desayuno/
   Americano/Buffet). Se arma tomando los módulos "Convenio Avanta Sin Desayuno",
   "Convenio Avanta Con Desayuno Americano" y "Convenio Avanta Con Desayuno Buffet"
   (valores de 1-2 pax, que es lo que ese formato usa hoy). Sin cambios de código en
   ese repo.
2. **`tarifas-cotizador.json`** — nuevo archivo con la forma anidada que usa
   `cotizacion-avanta`: `{"Con Convenio": {...}, "Sin Convenio": {...}}` × 3 tipos de
   desayuno × 4 tipos de habitación × pax 1-5 (pax 5 = pax 4 + persona_extra de esa
   tarifa/tipo de habitación). Se arma con los 6 módulos "Convenio Avanta X" / "Sin
   Convenio X" (no incluye los módulos de OTA's, que ese cotizador no usa).
   - Incluye refactorizar `cotizacion-avanta/api/generar-cotizacion-pdf.py`: reemplazar
     el diccionario `TARIFAS` hardcodeado por una lectura de este JSON al arrancar la
     función (mismo patrón try/except con fallback a los valores actuales que ya usa
     `convenios-avanta-2026/api/generar-convenio-pdf.py`), para que el archivo que
     coloque Ricardo sí tenga efecto.
3. **`cotizacion-sala-nova`** — sin cambios, no consume tarifas de habitación.

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
- Caso límite: tipo de habitación con capacidad 3 no debe generar columna de 4 pax ni
  pax 5 en el JSON exportado (solo las 4 con capacidad 5 lo tienen).
- Test del export `tarifas-cotizador.json`: verificar que pax 5 = pax 4 + persona_extra
  para cada combinación tarifa × tipo de habitación con capacidad 5.
- Test de `cotizacion-avanta` tras el refactor: con el JSON presente, el PDF usa esos
  valores; si el archivo falta, cae a los valores por defecto actuales (sin romper).
