# Matriz de Tarifas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Matriz de Tarifas" dashboard inside `Formulario_Convenio` — login-gated, with a menu, editable rate matrix, module ("+") creation, an increase proposal view, edition history, and JSON/PDF exports consumed by `convenios-avanta-2026` and `cotizacion-avanta`.

**Architecture:** React+TS+Vite+Tailwind frontend (new in-app view, no router library — a single pathname check in `main.tsx` switches between the existing convenio form and the new dashboard). Vercel serverless functions (Node/TS) under `api/` do CRUD against a new Postgres database (`avanta-db` on EasyPanel). Pure calculation/export-shaping logic lives in dependency-free TS modules so it can be unit-tested with Vitest without a live database. PDF export and the `cotizacion-avanta` refactor use Python/ReportLab, matching the existing pattern in that repo.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind (existing) · `pg` (new) · Vitest (new, dev-only) · Node `crypto` (stdlib, no new auth library) · Python + ReportLab (existing pattern, reused in `cotizacion-avanta`)

## Global Constraints

- Español mexicano en toda la UI y mensajes de error (spec §i18n).
- 2 usuarios fijos (Ricardo, Isabel), mismos permisos, sin sistema de roles (spec §Fuera de alcance).
- Sin push automático a otros repos — el dashboard genera archivos, colocarlos es manual (spec §Exportación).
- `cotizacion-sala-nova` no se toca (spec §Fuera de alcance).
- Montos numéricos positivos; `N/A` es un valor explícito distinto de 0 (spec §Validación).
- `capacidad_personas` de cada tipo de habitación limita qué columnas de pax existen (spec §Validación).
- Reusar los tokens Tailwind ya definidos (`font-kodchasan`, `green` `#7FA44A`, `green-dark` `#5F7F34`) — no introducir una paleta nueva.

---

## Task 0: Fix the broken Vite entry point (blocks every later task)

**Context:** Commit `c7505ad` ("fix: redirect GitHub Pages roto...") replaced the real Vite entry in `index.html` with a GitHub-Pages-only meta-refresh redirect to `https://formulario-convenio.vercel.app`. Because this repo has no `vercel.json`, Vercel's zero-config Vite build uses this same `index.html` as its build template. The current production build therefore has **no `<script type="module" src="/src/main.tsx">` tag at all** — the live site is (or will become, on next deploy) a page that redirects to itself. `dist/index.html` in the repo still has the old working markup only because it's a stale build from before that commit. This must be fixed before adding a new route, or the new dashboard (and the existing convenio form) won't deploy.

**Files:**
- Modify: `Formulario_Convenio/index.html`

**Interfaces:** None (static HTML).

- [ ] **Step 1: Restore the real Vite entry**

Replace the full contents of `index.html` with:

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Convenio Avanta Hotel &amp; Villas</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Kodchasan:wght@300;400;500;600&family=Cormorant+Garamond:wght@300;400;500&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify the dev server boots and the existing form renders**

Run: `npm run dev`
Expected: Vite prints a local URL; opening it shows the convenio form (aside + form), not a redirect.

- [ ] **Step 3: Verify the production build works**

Run: `npm run build`
Expected: exits 0, and `dist/index.html` contains a `<script type="module" ...>` tag pointing at a hashed `assets/index-*.js` file (not a meta-refresh).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix: restore Vite entry point clobbered by GitHub Pages redirect"
```

**Note for Ricardo:** GitHub Pages hosting for this repo (if still enabled in repo Settings → Pages) will go back to showing whatever is at `main`'s `index.html` — i.e. the real app shell, unbuilt. Since the supported deploy target is Vercel (per `CLAUDE.md`), the simplest fix is to turn GitHub Pages off entirely in the repo settings; that's a GitHub UI setting, not something in this codebase, so it isn't a plan step.

---

## Task 1: Postgres schema and seed data

**Files:**
- Create: `Formulario_Convenio/db/schema.sql`
- Create: `Formulario_Convenio/db/seed.sql`

**Interfaces:**
- Produces: the 9 tables every later task's SQL queries assume exist, exactly as named/typed here.

- [ ] **Step 1: Write the schema**

`Formulario_Convenio/db/schema.sql`:

```sql
CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE ediciones (
  id                  SERIAL PRIMARY KEY,
  anio                INT NOT NULL UNIQUE,
  estado              TEXT NOT NULL DEFAULT 'borrador'
                        CHECK (estado IN ('borrador', 'activa', 'archivada')),
  aumento_default_mxn NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fecha_publicacion   TIMESTAMPTZ
);

CREATE TABLE canales_venta (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE secciones (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE tipos_habitacion (
  id                  SERIAL PRIMARY KEY,
  seccion_id          INT NOT NULL REFERENCES secciones(id),
  nombre              TEXT NOT NULL,
  camas_descripcion   TEXT NOT NULL,
  capacidad_personas  INT NOT NULL,
  UNIQUE (seccion_id, nombre)
);

CREATE TABLE tarifas (
  id             SERIAL PRIMARY KEY,
  edicion_id     INT NOT NULL REFERENCES ediciones(id),
  nombre         TEXT NOT NULL,
  vigencia_desde DATE,
  vigencia_hasta DATE,
  UNIQUE (edicion_id, nombre)
);

CREATE TABLE tarifa_canales (
  tarifa_id INT NOT NULL REFERENCES tarifas(id) ON DELETE CASCADE,
  canal_id  INT NOT NULL REFERENCES canales_venta(id),
  PRIMARY KEY (tarifa_id, canal_id)
);

CREATE TABLE tarifa_valores (
  tarifa_id         INT NOT NULL REFERENCES tarifas(id) ON DELETE CASCADE,
  tipo_habitacion_id INT NOT NULL REFERENCES tipos_habitacion(id),
  pax               INT NOT NULL CHECK (pax BETWEEN 1 AND 4),
  monto_actual      NUMERIC(10, 2),
  monto_propuesto   NUMERIC(10, 2),
  PRIMARY KEY (tarifa_id, tipo_habitacion_id, pax)
);

CREATE TABLE tarifa_persona_extra (
  tarifa_id         INT NOT NULL REFERENCES tarifas(id) ON DELETE CASCADE,
  tipo_habitacion_id INT NOT NULL REFERENCES tipos_habitacion(id),
  monto_actual      NUMERIC(10, 2),
  monto_propuesto   NUMERIC(10, 2),
  PRIMARY KEY (tarifa_id, tipo_habitacion_id)
);
```

- [ ] **Step 2: Write the seed data**

`Formulario_Convenio/db/seed.sql` (2 users, catalogs, the 2026 edition with its 10 confirmed modules — password hashes are placeholders replaced in Task 3's setup, not in SQL):

```sql
INSERT INTO secciones (nombre) VALUES ('Hotel'), ('Villas');

INSERT INTO tipos_habitacion (seccion_id, nombre, camas_descripcion, capacidad_personas) VALUES
  ((SELECT id FROM secciones WHERE nombre = 'Hotel'),  'Sencilla King Hotel',  '1 cama King Size', 3),
  ((SELECT id FROM secciones WHERE nombre = 'Hotel'),  'Doble Queen Hotel',    '2 camas Queen Size', 5),
  ((SELECT id FROM secciones WHERE nombre = 'Villas'), 'Sencilla King Villas', '1 cama King Size', 3),
  ((SELECT id FROM secciones WHERE nombre = 'Villas'), 'Doble Queen Villas',   '2 camas Queen Size', 5);

INSERT INTO canales_venta (nombre) VALUES
  ('Direct Booking'), ('Walk-In'), ('Reservas'), ('Extranet'),
  ('OTA''s'), ('Convenios'), ('Campañas RRSS'), ('Demand Plus'), ('Airbnb');

INSERT INTO ediciones (anio, estado, aumento_default_mxn) VALUES (2026, 'borrador', 80.00);

-- Helper: every INSERT below reads the edicion_id and tipo_habitacion ids by name,
-- so this file can run once against an empty database.

-- Sin Convenio Sin Desayuno
WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'Sin Convenio Sin Desayuno')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, c.id FROM t, canales_venta c
WHERE c.nombre IN ('Direct Booking', 'Walk-In', 'Reservas', 'Extranet');

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT
  (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Sin Desayuno'),
  th.id, v.pax, v.monto
FROM tipos_habitacion th
JOIN (VALUES
  ('Sencilla King Hotel',  1, 850), ('Sencilla King Hotel',  2, 850), ('Sencilla King Hotel',  3, 950),
  ('Doble Queen Hotel',    1, 1050),('Doble Queen Hotel',    2, 1050),('Doble Queen Hotel',    3, 1150),('Doble Queen Hotel', 4, 1250),
  ('Sencilla King Villas', 1, 750), ('Sencilla King Villas', 2, 750), ('Sencilla King Villas', 3, 850),
  ('Doble Queen Villas',   1, 950), ('Doble Queen Villas',   2, 950), ('Doble Queen Villas',   3, 1050),('Doble Queen Villas', 4, 1150)
) AS v(nombre, pax, monto) ON v.nombre = th.nombre;

INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Sin Desayuno'), th.id, 100
FROM tipos_habitacion th WHERE th.capacidad_personas > 4;

-- Sin Convenio Con Desayuno Buffet
WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'Sin Convenio Con Desayuno Buffet')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, c.id FROM t, canales_venta c
WHERE c.nombre IN ('Direct Booking', 'Walk-In', 'Reservas', 'Extranet');

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT
  (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Con Desayuno Buffet'),
  th.id, v.pax, v.monto
FROM tipos_habitacion th
JOIN (VALUES
  ('Sencilla King Hotel',  1, 1090),('Sencilla King Hotel',  2, 1330),('Sencilla King Hotel',  3, 1570),
  ('Doble Queen Hotel',    1, 1530),('Doble Queen Hotel',    2, 1530),('Doble Queen Hotel',    3, 1770),('Doble Queen Hotel', 4, 2010),
  ('Sencilla King Villas', 1, 990), ('Sencilla King Villas', 2, 1230),('Sencilla King Villas', 3, 1470),
  ('Doble Queen Villas',   1, 1190),('Doble Queen Villas',   2, 1430),('Doble Queen Villas',   3, 1670),('Doble Queen Villas', 4, 1910)
) AS v(nombre, pax, monto) ON v.nombre = th.nombre;

INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Con Desayuno Buffet'), th.id, 150
FROM tipos_habitacion th WHERE th.capacidad_personas > 4;

-- Sin Convenio Con Desayuno Americano
WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'Sin Convenio Con Desayuno Americano')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, c.id FROM t, canales_venta c
WHERE c.nombre IN ('Direct Booking', 'Walk-In', 'Reservas', 'Extranet');

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT
  (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Con Desayuno Americano'),
  th.id, v.pax, v.monto
FROM tipos_habitacion th
JOIN (VALUES
  ('Sencilla King Hotel',  1, 940), ('Sencilla King Hotel',  2, 940), ('Sencilla King Hotel',  3, 1090),
  ('Doble Queen Hotel',    1, 1240),('Doble Queen Hotel',    2, 1240),('Doble Queen Hotel',    3, 1390),('Doble Queen Hotel', 4, 1540),
  ('Sencilla King Villas', 1, 940), ('Sencilla King Villas', 2, 940), ('Sencilla King Villas', 3, 1090),
  ('Doble Queen Villas',   1, 1240),('Doble Queen Villas',   2, 1240),('Doble Queen Villas',   3, 1390),('Doble Queen Villas', 4, 1540)
) AS v(nombre, pax, monto) ON v.nombre = th.nombre;

INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Con Desayuno Americano'), th.id, 100
FROM tipos_habitacion th WHERE th.capacidad_personas > 4;

-- Convenio Avanta Sin Desayuno
WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'Convenio Avanta Sin Desayuno')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, (SELECT id FROM canales_venta WHERE nombre = 'Convenios') FROM t;

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT
  (SELECT id FROM tarifas WHERE nombre = 'Convenio Avanta Sin Desayuno'),
  th.id, v.pax, v.monto
FROM tipos_habitacion th
JOIN (VALUES
  ('Sencilla King Hotel',  1, 800), ('Sencilla King Hotel',  2, 800), ('Sencilla King Hotel',  3, 900),
  ('Doble Queen Hotel',    1, 1000),('Doble Queen Hotel',    2, 1000),('Doble Queen Hotel',    3, 1100),('Doble Queen Hotel', 4, 1200),
  ('Sencilla King Villas', 1, 700), ('Sencilla King Villas', 2, 700), ('Sencilla King Villas', 3, 800),
  ('Doble Queen Villas',   1, 900), ('Doble Queen Villas',   2, 900), ('Doble Queen Villas',   3, 1000),('Doble Queen Villas', 4, 1100)
) AS v(nombre, pax, monto) ON v.nombre = th.nombre;

INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'Convenio Avanta Sin Desayuno'), th.id, 100
FROM tipos_habitacion th WHERE th.capacidad_personas > 4;

-- Convenio Avanta Con Desayuno Buffet
WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'Convenio Avanta Con Desayuno Buffet')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, (SELECT id FROM canales_venta WHERE nombre = 'Convenios') FROM t;

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT
  (SELECT id FROM tarifas WHERE nombre = 'Convenio Avanta Con Desayuno Buffet'),
  th.id, v.pax, v.monto
FROM tipos_habitacion th
JOIN (VALUES
  ('Sencilla King Hotel',  1, 1040),('Sencilla King Hotel',  2, 1280),('Sencilla King Hotel',  3, 1520),
  ('Doble Queen Hotel',    2, 1480),('Doble Queen Hotel',    3, 1720),('Doble Queen Hotel', 4, 1960),
  ('Sencilla King Villas', 1, 940), ('Sencilla King Villas', 2, 1180),('Sencilla King Villas', 3, 1420),
  ('Doble Queen Villas',   1, 1180),('Doble Queen Villas',   2, 1380),('Doble Queen Villas',   3, 1620),('Doble Queen Villas', 4, 1860)
) AS v(nombre, pax, monto) ON v.nombre = th.nombre;

INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'Convenio Avanta Con Desayuno Buffet'), th.id, 150
FROM tipos_habitacion th WHERE th.capacidad_personas > 4;

-- Convenio Avanta Con Desayuno Americano
WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'Convenio Avanta Con Desayuno Americano')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, (SELECT id FROM canales_venta WHERE nombre = 'Convenios') FROM t;

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT
  (SELECT id FROM tarifas WHERE nombre = 'Convenio Avanta Con Desayuno Americano'),
  th.id, v.pax, v.monto
FROM tipos_habitacion th
JOIN (VALUES
  ('Sencilla King Hotel',  1, 890), ('Sencilla King Hotel',  2, 890), ('Sencilla King Hotel',  3, 1040),
  ('Doble Queen Hotel',    1, 1190),('Doble Queen Hotel',    2, 1190),('Doble Queen Hotel',    3, 1340),('Doble Queen Hotel', 4, 1490),
  ('Sencilla King Villas', 1, 890), ('Sencilla King Villas', 2, 890), ('Sencilla King Villas', 3, 1040),
  ('Doble Queen Villas',   1, 1190),('Doble Queen Villas',   2, 1190),('Doble Queen Villas',   3, 1340),('Doble Queen Villas', 4, 1490)
) AS v(nombre, pax, monto) ON v.nombre = th.nombre;

INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'Convenio Avanta Con Desayuno Americano'), th.id, 100
FROM tipos_habitacion th WHERE th.capacidad_personas > 4;

-- OTA's — sin desayuno (mismos montos que Direct Booking sin desayuno)
WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'OTA''s 0 a 50% Sin Desayuno')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, (SELECT id FROM canales_venta WHERE nombre = 'OTA''s') FROM t;

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'OTA''s 0 a 50% Sin Desayuno'), tipo_habitacion_id, pax, monto_actual
FROM tarifa_valores WHERE tarifa_id = (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Sin Desayuno');

INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'OTA''s 0 a 50% Sin Desayuno'), tipo_habitacion_id, monto_actual
FROM tarifa_persona_extra WHERE tarifa_id = (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Sin Desayuno');

WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'OTA''s 50 a 100% Sin Desayuno')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, (SELECT id FROM canales_venta WHERE nombre = 'OTA''s') FROM t;

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'OTA''s 50 a 100% Sin Desayuno'), tipo_habitacion_id, pax, monto_actual
FROM tarifa_valores WHERE tarifa_id = (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Sin Desayuno');

INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'OTA''s 50 a 100% Sin Desayuno'), tipo_habitacion_id, monto_actual
FROM tarifa_persona_extra WHERE tarifa_id = (SELECT id FROM tarifas WHERE nombre = 'Sin Convenio Sin Desayuno');

-- OTA's — con desayuno buffet, solo Hotel (Villas y persona extra quedan NULL a propósito)
WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'OTA''s 0 a 50% Con Desayuno Buffet')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, (SELECT id FROM canales_venta WHERE nombre = 'OTA''s') FROM t;

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'OTA''s 0 a 50% Con Desayuno Buffet'), th.id, v.pax, v.monto
FROM tipos_habitacion th
JOIN (VALUES
  ('Sencilla King Hotel', 1, 1090), ('Sencilla King Hotel', 2, 1330), ('Sencilla King Hotel', 3, 1570),
  ('Doble Queen Hotel',   1, 1530), ('Doble Queen Hotel',   2, 1530), ('Doble Queen Hotel',   3, 1770), ('Doble Queen Hotel', 4, 2010)
) AS v(nombre, pax, monto) ON v.nombre = th.nombre;

WITH t AS (
  INSERT INTO tarifas (edicion_id, nombre)
  VALUES ((SELECT id FROM ediciones WHERE anio = 2026), 'OTA''s 50 a 100% Con Desayuno Buffet')
  RETURNING id
)
INSERT INTO tarifa_canales (tarifa_id, canal_id)
SELECT t.id, (SELECT id FROM canales_venta WHERE nombre = 'OTA''s') FROM t;

INSERT INTO tarifa_valores (tarifa_id, tipo_habitacion_id, pax, monto_actual)
SELECT (SELECT id FROM tarifas WHERE nombre = 'OTA''s 50 a 100% Con Desayuno Buffet'), th.id, v.pax, v.monto
FROM tipos_habitacion th
JOIN (VALUES
  ('Sencilla King Hotel', 1, 1140), ('Sencilla King Hotel', 2, 1380), ('Sencilla King Hotel', 3, 1620),
  ('Doble Queen Hotel',   1, 1580), ('Doble Queen Hotel',   2, 1580), ('Doble Queen Hotel',   3, 1820), ('Doble Queen Hotel', 4, 2060)
) AS v(nombre, pax, monto) ON v.nombre = th.nombre;
```

- [ ] **Step 2: Provision the database and run both files**

Run (replace with the real EasyPanel Postgres connection string once `avanta-db` is provisioned):

```bash
psql "$DATABASE_URL" -f Formulario_Convenio/db/schema.sql
psql "$DATABASE_URL" -f Formulario_Convenio/db/seed.sql
```

Expected: no errors; `psql "$DATABASE_URL" -c "SELECT nombre FROM tarifas;"` lists the 10 module names from the spec's seed table.

- [ ] **Step 3: Commit**

```bash
git add db/schema.sql db/seed.sql
git commit -m "feat: add Matriz de Tarifas Postgres schema and 2026 seed data"
```

---

## Task 2: Pure calculation module (`matrizCalc`)

**Files:**
- Create: `Formulario_Convenio/api/_lib/matrizCalc.ts`
- Test: `Formulario_Convenio/api/_lib/matrizCalc.test.ts`

**Interfaces:**
- Produces:
  - `computeMontoPropuesto(montoActual: number | null, aumentoDefault: number, override: number | null): number | null`
  - `paxColumnasPermitidas(capacidadPersonas: number): number[]` — e.g. capacity 3 → `[1,2,3]`, capacity 5 → `[1,2,3,4]` (pax 5 is handled separately via persona_extra, never as a grid column).

- [ ] **Step 1: Write the failing tests**

```ts
// Formulario_Convenio/api/_lib/matrizCalc.test.ts
import { describe, it, expect } from 'vitest'
import { computeMontoPropuesto, paxColumnasPermitidas } from './matrizCalc'

describe('computeMontoPropuesto', () => {
  it('adds the default increase when there is no override', () => {
    expect(computeMontoPropuesto(850, 80, null)).toBe(930)
  })

  it('returns the override untouched when present', () => {
    expect(computeMontoPropuesto(850, 80, 999)).toBe(999)
  })

  it('returns null when the current amount is null (N/A cell)', () => {
    expect(computeMontoPropuesto(null, 80, null)).toBeNull()
  })
})

describe('paxColumnasPermitidas', () => {
  it('limits capacity-3 rooms to pax 1-3', () => {
    expect(paxColumnasPermitidas(3)).toEqual([1, 2, 3])
  })

  it('limits capacity-5 rooms to pax 1-4 in the grid (5th pax is persona_extra)', () => {
    expect(paxColumnasPermitidas(5)).toEqual([1, 2, 3, 4])
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run api/_lib/matrizCalc.test.ts`
Expected: FAIL — `Cannot find module './matrizCalc'`

- [ ] **Step 3: Implement the module**

```ts
// Formulario_Convenio/api/_lib/matrizCalc.ts
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
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run api/_lib/matrizCalc.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add api/_lib/matrizCalc.ts api/_lib/matrizCalc.test.ts
git commit -m "feat: add matriz de tarifas pure calculation module"
```

---

## Task 3: Export-shaping module (`exportFormats`)

**Files:**
- Create: `Formulario_Convenio/api/_lib/exportFormats.ts`
- Test: `Formulario_Convenio/api/_lib/exportFormats.test.ts`

**Interfaces:**
- Consumes: nothing from other modules (pure data in, data out).
- Produces:
  - `buildTarifasJson(anio: number, tarifas: TarifaConValores[]): TarifasJsonV1` — the flat 6-key shape `convenios-avanta-2026` reads.
  - `buildTarifasCotizadorJson(tarifas: TarifaConValores[]): TarifasCotizadorJson` — the nested `Con Convenio` / `Sin Convenio` shape `cotizacion-avanta` reads, including pax 5 = pax 4 + persona_extra.
  - Shared type `TarifaConValores` (defined in this file, imported by Task 9's publish endpoint).

- [ ] **Step 1: Write the failing tests**

```ts
// Formulario_Convenio/api/_lib/exportFormats.test.ts
import { describe, it, expect } from 'vitest'
import { buildTarifasJson, buildTarifasCotizadorJson, type TarifaConValores } from './exportFormats'

const convenioSin: TarifaConValores = {
  nombre: 'Convenio Avanta Sin Desayuno',
  valores: [
    { tipoHabitacion: 'Sencilla King Hotel', pax: 1, montoActual: 800 },
    { tipoHabitacion: 'Sencilla King Hotel', pax: 2, montoActual: 800 },
    { tipoHabitacion: 'Doble Queen Hotel', pax: 1, montoActual: 1000 },
    { tipoHabitacion: 'Doble Queen Hotel', pax: 2, montoActual: 1000 },
    { tipoHabitacion: 'Doble Queen Hotel', pax: 4, montoActual: 1200 },
  ],
  personaExtra: [{ tipoHabitacion: 'Doble Queen Hotel', montoActual: 100 }],
}

describe('buildTarifasJson', () => {
  it('maps the Convenio Avanta módulos onto the flat 6-key shape', () => {
    const result = buildTarifasJson(2026, [convenioSin])
    expect(result.version).toBe('2026')
    expect(result.tarifas.habitacionKingSinDesayuno).toBe(800)
    expect(result.tarifas.habitacionQueenSinDesayuno).toBe(1000)
  })
})

describe('buildTarifasCotizadorJson', () => {
  it('computes pax 5 as pax 4 plus persona_extra for capacity-5 rooms', () => {
    const result = buildTarifasCotizadorJson([convenioSin])
    const queen = result['Sin Convenio']['Sin Desayuno']['Doble Queen Hotel']
    expect(queen[4]).toBe(1200)
    expect(queen[5]).toBe(1300) // 1200 + 100 persona_extra
  })

  it('omits pax 5 for rooms with no persona_extra entry', () => {
    const result = buildTarifasCotizadorJson([convenioSin])
    const king = result['Sin Convenio']['Sin Desayuno']['Sencilla King Hotel']
    expect(king[5]).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run api/_lib/exportFormats.test.ts`
Expected: FAIL — `Cannot find module './exportFormats'`

- [ ] **Step 3: Implement the module**

```ts
// Formulario_Convenio/api/_lib/exportFormats.ts
export interface TarifaValorExport {
  tipoHabitacion: string
  pax: number
  montoActual: number | null
}

export interface TarifaPersonaExtraExport {
  tipoHabitacion: string
  montoActual: number | null
}

export interface TarifaConValores {
  nombre: string
  valores: TarifaValorExport[]
  personaExtra: TarifaPersonaExtraExport[]
}

export interface TarifasJsonV1 {
  version: string
  fechaActualizacion: string
  vigenciaDesde: string
  vigenciaHasta: string
  tarifas: {
    habitacionKingSinDesayuno: number
    habitacionQueenSinDesayuno: number
    habitacionKingDesayunoAmericano: number
    habitacionQueenDesayunoAmericano: number
    habitacionKingDesayunoBuffet: number
    habitacionQueenDesayunoBuffet: number
  }
  moneda: string
  codigoPromo: string
}

const V1_MODULE_MAP: Record<string, keyof TarifasJsonV1['tarifas']> = {
  'Convenio Avanta Sin Desayuno|Sencilla King Hotel': 'habitacionKingSinDesayuno',
  'Convenio Avanta Sin Desayuno|Doble Queen Hotel': 'habitacionQueenSinDesayuno',
  'Convenio Avanta Con Desayuno Americano|Sencilla King Hotel': 'habitacionKingDesayunoAmericano',
  'Convenio Avanta Con Desayuno Americano|Doble Queen Hotel': 'habitacionQueenDesayunoAmericano',
  'Convenio Avanta Con Desayuno Buffet|Sencilla King Hotel': 'habitacionKingDesayunoBuffet',
  'Convenio Avanta Con Desayuno Buffet|Doble Queen Hotel': 'habitacionQueenDesayunoBuffet',
}

export function buildTarifasJson(anio: number, tarifas: TarifaConValores[]): TarifasJsonV1 {
  const tarifasOut = {} as TarifasJsonV1['tarifas']
  for (const tarifa of tarifas) {
    for (const valor of tarifa.valores) {
      if (valor.pax !== 1 || valor.montoActual === null) continue
      const key = V1_MODULE_MAP[`${tarifa.nombre}|${valor.tipoHabitacion}`]
      if (key) tarifasOut[key] = valor.montoActual
    }
  }
  const hoy = new Date().toISOString().slice(0, 10)
  return {
    version: String(anio),
    fechaActualizacion: hoy,
    vigenciaDesde: `${anio}-01-01`,
    vigenciaHasta: `${anio}-12-31`,
    tarifas: tarifasOut,
    moneda: 'MXN',
    codigoPromo: 'AVANTA',
  }
}

type Desayuno = 'Sin Desayuno' | 'Con Desayuno Buffet' | 'Con Desayuno Americano'
type PaxTable = Record<number, number>
export type TarifasCotizadorJson = Record<'Con Convenio' | 'Sin Convenio', Record<Desayuno, Record<string, PaxTable>>>

const COTIZADOR_MODULE_MAP: Record<string, { grupo: 'Con Convenio' | 'Sin Convenio'; desayuno: Desayuno }> = {
  'Convenio Avanta Sin Desayuno': { grupo: 'Con Convenio', desayuno: 'Sin Desayuno' },
  'Convenio Avanta Con Desayuno Buffet': { grupo: 'Con Convenio', desayuno: 'Con Desayuno Buffet' },
  'Convenio Avanta Con Desayuno Americano': { grupo: 'Con Convenio', desayuno: 'Con Desayuno Americano' },
  'Sin Convenio Sin Desayuno': { grupo: 'Sin Convenio', desayuno: 'Sin Desayuno' },
  'Sin Convenio Con Desayuno Buffet': { grupo: 'Sin Convenio', desayuno: 'Con Desayuno Buffet' },
  'Sin Convenio Con Desayuno Americano': { grupo: 'Sin Convenio', desayuno: 'Con Desayuno Americano' },
}

export function buildTarifasCotizadorJson(tarifas: TarifaConValores[]): TarifasCotizadorJson {
  const out: TarifasCotizadorJson = { 'Con Convenio': {} as any, 'Sin Convenio': {} as any }

  for (const tarifa of tarifas) {
    const mapping = COTIZADOR_MODULE_MAP[tarifa.nombre]
    if (!mapping) continue // OTA's módulos aren't part of this export

    out[mapping.grupo][mapping.desayuno] ??= {}
    const porHabitacion = out[mapping.grupo][mapping.desayuno]

    const extraPorHabitacion = new Map(tarifa.personaExtra.map((e) => [e.tipoHabitacion, e.montoActual]))

    for (const valor of tarifa.valores) {
      if (valor.montoActual === null) continue
      porHabitacion[valor.tipoHabitacion] ??= {}
      porHabitacion[valor.tipoHabitacion][valor.pax] = valor.montoActual

      if (valor.pax === 4) {
        const extra = extraPorHabitacion.get(valor.tipoHabitacion)
        if (extra !== undefined && extra !== null) {
          porHabitacion[valor.tipoHabitacion][5] = valor.montoActual + extra
        }
      }
    }
  }

  return out
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run api/_lib/exportFormats.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add api/_lib/exportFormats.ts api/_lib/exportFormats.test.ts
git commit -m "feat: add tarifas.json and tarifas-cotizador.json export shaping"
```

---

## Task 4: Vitest wiring

**Files:**
- Modify: `Formulario_Convenio/package.json`

**Interfaces:** None — this just makes Tasks 2-3's tests (and every later test in this plan) runnable.

- [ ] **Step 1: Add the dependency and script**

```bash
npm install -D vitest
```

Then add to `package.json` under `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: PASS — both `matrizCalc.test.ts` and `exportFormats.test.ts` reported green (7 tests total).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vitest for Matriz de Tarifas unit tests"
```

---

## Task 5: DB pool and auth helpers

**Files:**
- Create: `Formulario_Convenio/api/_lib/db.ts`
- Create: `Formulario_Convenio/api/_lib/auth.ts`
- Test: `Formulario_Convenio/api/_lib/auth.test.ts`

**Interfaces:**
- Produces:
  - `pool: import('pg').Pool` (default export of `db.ts`)
  - `hashPassword(password: string): string`
  - `verifyPassword(password: string, stored: string): boolean`
  - `signSession(payload: { uid: number }): string`
  - `verifySession(token: string): { uid: number } | null`
  - `SESSION_COOKIE_NAME: string`

- [ ] **Step 1: Write the failing tests**

```ts
// Formulario_Convenio/api/_lib/auth.test.ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signSession, verifySession } from './auth'

describe('password hashing', () => {
  it('verifies a correct password', () => {
    const stored = hashPassword('mi-clave-segura')
    expect(verifyPassword('mi-clave-segura', stored)).toBe(true)
  })

  it('rejects an incorrect password', () => {
    const stored = hashPassword('mi-clave-segura')
    expect(verifyPassword('otra-clave', stored)).toBe(false)
  })
})

describe('session signing', () => {
  it('round-trips a valid session', () => {
    const token = signSession({ uid: 7 })
    expect(verifySession(token)).toEqual({ uid: 7 })
  })

  it('rejects a tampered token', () => {
    const token = signSession({ uid: 7 })
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(verifySession(tampered)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `SESSION_SECRET=test-secret npx vitest run api/_lib/auth.test.ts`
Expected: FAIL — `Cannot find module './auth'`

- [ ] **Step 3: Implement `db.ts`**

```ts
// Formulario_Convenio/api/_lib/db.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export default pool
```

- [ ] **Step 4: Implement `auth.ts`**

```ts
// Formulario_Convenio/api/_lib/auth.ts
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET no está configurado')
  return secret
}

export function signSession(payload: { uid: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifySession(token: string): { uid: number } | null {
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'))
  } catch {
    return null
  }
}

export const SESSION_COOKIE_NAME = 'avanta_session'
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `SESSION_SECRET=test-secret npx vitest run api/_lib/auth.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Install `pg` and commit**

```bash
npm install pg
npm install -D @types/pg
git add api/_lib/db.ts api/_lib/auth.ts api/_lib/auth.test.ts package.json package-lock.json
git commit -m "feat: add Postgres pool and session/password auth helpers"
```

---

## Task 6: Auth API endpoints

**Files:**
- Create: `Formulario_Convenio/api/auth/login.ts`
- Create: `Formulario_Convenio/api/auth/logout.ts`
- Create: `Formulario_Convenio/api/auth/me.ts`
- Create: `Formulario_Convenio/api/_lib/requireAuth.ts`

**Interfaces:**
- Consumes: `hashPassword`/`verifyPassword`/`signSession`/`verifySession`/`SESSION_COOKIE_NAME` from Task 5; `pool` from Task 5.
- Produces: `requireAuth(req): Promise<{ uid: number } | null>` — every later API task (7-10) calls this first and returns 401 if it's null.

- [ ] **Step 1: Implement the shared auth guard**

```ts
// Formulario_Convenio/api/_lib/requireAuth.ts
import type { VercelRequest } from '@vercel/node'
import { verifySession, SESSION_COOKIE_NAME } from './auth'

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k) out[k] = decodeURIComponent(v.join('='))
  }
  return out
}

export function requireAuth(req: VercelRequest): { uid: number } | null {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies[SESSION_COOKIE_NAME]
  if (!token) return null
  return verifySession(token)
}
```

- [ ] **Step 2: Implement login**

```ts
// Formulario_Convenio/api/auth/login.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { verifyPassword, signSession, SESSION_COOKIE_NAME } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  const { email, password } = req.body ?? {}
  if (!email || !password) return res.status(400).json({ error: 'Falta email o contraseña' })

  const { rows } = await pool.query('SELECT id, password_hash FROM usuarios WHERE email = $1', [email])
  const usuario = rows[0]
  if (!usuario || !verifyPassword(password, usuario.password_hash)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  }

  const token = signSession({ uid: usuario.id })
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
  )
  return res.status(200).json({ ok: true })
}
```

- [ ] **Step 3: Implement logout and "me"**

```ts
// Formulario_Convenio/api/auth/logout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SESSION_COOKIE_NAME } from '../_lib/auth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`)
  return res.status(200).json({ ok: true })
}
```

```ts
// Formulario_Convenio/api/auth/me.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireAuth(req)
  if (!session) return res.status(401).json({ error: 'No autenticado' })

  const { rows } = await pool.query('SELECT nombre, email FROM usuarios WHERE id = $1', [session.uid])
  if (!rows[0]) return res.status(401).json({ error: 'No autenticado' })
  return res.status(200).json(rows[0])
}
```

- [ ] **Step 4: Seed the 2 real users with hashed passwords**

Run once against the database (replace the two passwords before running, then discard this snippet — it is not committed with real passwords in it):

```bash
node -e "
const { hashPassword } = require('./api/_lib/auth.ts');
" 2>/dev/null || true
```

Since `auth.ts` is TS, run this as a one-off script instead:

```bash
cat > /tmp/seed-users.mjs << 'EOF'
import { scryptSync, randomBytes } from 'node:crypto'
import pg from 'pg'

function hash(password) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await pool.query('INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1,$2,$3), ($4,$5,$6)', [
  'Ricardo', 'ricardo@avantahotel.com.mx', hash(process.env.RICARDO_PASSWORD),
  'Isabel', 'isabel@avantahotel.com.mx', hash(process.env.ISABEL_PASSWORD),
])
await pool.end()
console.log('usuarios creados')
EOF
DATABASE_URL="$DATABASE_URL" RICARDO_PASSWORD="elige-una" ISABEL_PASSWORD="elige-otra" node /tmp/seed-users.mjs
```

Expected: `usuarios creados` printed; `SELECT email FROM usuarios;` returns both addresses.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev` (Vite serves the frontend; use `vercel dev` instead if you want the `api/` routes live locally — plain `vite` does not execute `api/*.ts`)

With `vercel dev` running:
```bash
curl -i -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ricardo@avantahotel.com.mx","password":"elige-una"}'
curl -i -b /tmp/cookies.txt http://localhost:3000/api/auth/me
```
Expected: login returns `{"ok":true}` with a `Set-Cookie` header; `me` returns `{"nombre":"Ricardo","email":"ricardo@avantahotel.com.mx"}`.

- [ ] **Step 6: Commit**

```bash
git add api/auth api/_lib/requireAuth.ts
git commit -m "feat: add login/logout/me endpoints for Matriz de Tarifas"
```

---

## Task 7: Canales API

**Files:**
- Create: `Formulario_Convenio/api/matriz/canales.ts`

**Interfaces:**
- Consumes: `requireAuth` (Task 6), `pool` (Task 5).
- Produces: `GET /api/matriz/canales → { id, nombre }[]`, `POST /api/matriz/canales { nombre } → { id, nombre }` — used by Task 13's "+ canal" UI.

- [ ] **Step 1: Implement the endpoint**

```ts
// Formulario_Convenio/api/matriz/canales.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'No autenticado' })

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT id, nombre FROM canales_venta ORDER BY nombre')
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { nombre } = req.body ?? {}
    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({ error: 'El canal necesita un nombre' })
    }
    const { rows } = await pool.query(
      'INSERT INTO canales_venta (nombre) VALUES ($1) RETURNING id, nombre',
      [nombre.trim()],
    )
    return res.status(201).json(rows[0])
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
```

- [ ] **Step 2: Manual smoke test (with `vercel dev` and the cookie from Task 6)**

```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/matriz/canales
curl -s -b /tmp/cookies.txt -X POST http://localhost:3000/api/matriz/canales \
  -H 'Content-Type: application/json' -d '{"nombre":"Referidos"}'
```
Expected: first call lists the 9 seeded channels; second returns `{"id":10,"nombre":"Referidos"}` and a re-run of the first call now includes it.

- [ ] **Step 3: Commit**

```bash
git add api/matriz/canales.ts
git commit -m "feat: add canales_venta list/create endpoint"
```

---

## Task 8: Tarifas (módulos) API

**Files:**
- Create: `Formulario_Convenio/api/matriz/tarifas.ts`

**Interfaces:**
- Consumes: `requireAuth`, `pool`.
- Produces:
  - `GET /api/matriz/tarifas?edicionId=1` → array of `{ id, nombre, vigenciaDesde, vigenciaHasta, canales: string[], valores: {tipoHabitacion, pax, montoActual, montoPropuesto}[], personaExtra: {tipoHabitacion, montoActual, montoPropuesto}[] }` — this is the shape Task 13/14's `TarifaCard` renders directly.
  - `POST /api/matriz/tarifas { edicionId, nombre, canalIds: number[], vigenciaDesde?, vigenciaHasta? }` → `{ id }` — creates an empty módulo (no `tarifa_valores` rows yet; the grid starts blank and Task 13's cell editor creates them via Task 9's endpoint).

- [ ] **Step 1: Implement the endpoint**

```ts
// Formulario_Convenio/api/matriz/tarifas.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'

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

    const [{ rows: canales }, { rows: valores }, { rows: extras }] = await Promise.all([
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
    ])

    const result = tarifas.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      vigenciaDesde: t.vigencia_desde,
      vigenciaHasta: t.vigencia_hasta,
      canales: canales.filter((c) => c.tarifa_id === t.id).map((c) => c.nombre),
      valores: valores
        .filter((v) => v.tarifa_id === t.id)
        .map((v) => ({
          tipoHabitacion: v.tipo_habitacion,
          pax: v.pax,
          montoActual: v.monto_actual === null ? null : Number(v.monto_actual),
          montoPropuesto: v.monto_propuesto === null ? null : Number(v.monto_propuesto),
        })),
      personaExtra: extras
        .filter((e) => e.tarifa_id === t.id)
        .map((e) => ({
          tipoHabitacion: e.tipo_habitacion,
          montoActual: e.monto_actual === null ? null : Number(e.monto_actual),
          montoPropuesto: e.monto_propuesto === null ? null : Number(e.monto_propuesto),
        })),
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
```

- [ ] **Step 2: Manual smoke test**

```bash
curl -s -b /tmp/cookies.txt "http://localhost:3000/api/matriz/tarifas?edicionId=1"
```
Expected: JSON array of 10 objects; `Convenio Avanta Sin Desayuno` has `valores` with 14 entries and `personaExtra` with 2 entries (Doble Queen Hotel and Doble Queen Villas), matching Task 1's seed.

- [ ] **Step 3: Commit**

```bash
git add api/matriz/tarifas.ts
git commit -m "feat: add tarifas list/create endpoint"
```

---

## Task 9: Tarifa-valores and persona-extra cell endpoints

**Files:**
- Create: `Formulario_Convenio/api/matriz/tarifa-valores.ts`
- Create: `Formulario_Convenio/api/matriz/tarifa-persona-extra.ts`

**Interfaces:**
- Consumes: `requireAuth`, `pool`.
- Produces:
  - `PUT /api/matriz/tarifa-valores { tarifaId, tipoHabitacion, pax, montoActual, montoPropuesto }` → `{ ok: true }` — upserts one grid cell. Used by Task 13's `TarifaCard` on blur.
  - `PUT /api/matriz/tarifa-persona-extra { tarifaId, tipoHabitacion, montoActual, montoPropuesto }` → `{ ok: true }` — upserts one persona-extra cell.

- [ ] **Step 1: Implement both endpoints**

```ts
// Formulario_Convenio/api/matriz/tarifa-valores.ts
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
```

```ts
// Formulario_Convenio/api/matriz/tarifa-persona-extra.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'

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

  await pool.query(
    `INSERT INTO tarifa_persona_extra (tarifa_id, tipo_habitacion_id, monto_actual, monto_propuesto)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (tarifa_id, tipo_habitacion_id)
     DO UPDATE SET monto_actual = $3, monto_propuesto = $4`,
    [tarifaId, th[0].id, montoActual ?? null, montoPropuesto ?? null],
  )
  return res.status(200).json({ ok: true })
}
```

- [ ] **Step 2: Manual smoke test**

```bash
curl -s -b /tmp/cookies.txt -X PUT http://localhost:3000/api/matriz/tarifa-valores \
  -H 'Content-Type: application/json' \
  -d '{"tarifaId":1,"tipoHabitacion":"Sencilla King Hotel","pax":1,"montoActual":900,"montoPropuesto":null}'
curl -s -b /tmp/cookies.txt "http://localhost:3000/api/matriz/tarifas?edicionId=1" | grep -o '"montoActual":900'
```
Expected: `PUT` returns `{"ok":true}`; the follow-up `GET` shows the updated value.

- [ ] **Step 3: Commit**

```bash
git add api/matriz/tarifa-valores.ts api/matriz/tarifa-persona-extra.ts
git commit -m "feat: add cell-level upsert endpoints for tarifa valores and persona extra"
```

---

## Task 10: Ediciones API (historial + publicar)

**Files:**
- Create: `Formulario_Convenio/api/matriz/ediciones.ts`
- Create: `Formulario_Convenio/api/matriz/publicar.ts`

**Interfaces:**
- Consumes: `requireAuth`, `pool`, `buildTarifasJson`/`buildTarifasCotizadorJson`/`TarifaConValores` (Task 3), `computeMontoPropuesto` (Task 2).
- Produces:
  - `GET /api/matriz/ediciones` → `{ id, anio, estado, aumentoDefaultMxn, fechaPublicacion }[]` — used by Task 16's historial view.
  - `PUT /api/matriz/ediciones/:id { aumentoDefaultMxn }` → `{ ok: true }` — used by Task 15's propuesta view to change the global increase.
  - `POST /api/matriz/publicar { edicionId }` → `{ tarifasJson, tarifasCotizadorJson }` — freezes the edition and returns both export files for download (Task 16 triggers this and offers the two JSONs as downloads).

- [ ] **Step 1: Implement `ediciones.ts`**

```ts
// Formulario_Convenio/api/matriz/ediciones.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'No autenticado' })

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      `SELECT id, anio, estado, aumento_default_mxn, fecha_publicacion FROM ediciones ORDER BY anio DESC`,
    )
    return res.status(200).json(
      rows.map((r) => ({
        id: r.id,
        anio: r.anio,
        estado: r.estado,
        aumentoDefaultMxn: Number(r.aumento_default_mxn),
        fechaPublicacion: r.fecha_publicacion,
      })),
    )
  }

  if (req.method === 'PUT') {
    const { id, aumentoDefaultMxn } = req.body ?? {}
    if (!id || typeof aumentoDefaultMxn !== 'number') {
      return res.status(400).json({ error: 'Falta id o aumentoDefaultMxn' })
    }
    await pool.query('UPDATE ediciones SET aumento_default_mxn = $1 WHERE id = $2', [aumentoDefaultMxn, id])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
```

- [ ] **Step 2: Implement `publicar.ts`**

```ts
// Formulario_Convenio/api/matriz/publicar.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import pool from '../_lib/db'
import { requireAuth } from '../_lib/requireAuth'
import { buildTarifasJson, buildTarifasCotizadorJson, type TarifaConValores } from '../_lib/exportFormats'

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
```

- [ ] **Step 3: Manual smoke test**

```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/matriz/ediciones
curl -s -b /tmp/cookies.txt -X POST http://localhost:3000/api/matriz/publicar \
  -H 'Content-Type: application/json' -d '{"edicionId":1}'
```
Expected: first call shows `estado: "borrador"`; second returns both JSON files with the seeded values; a repeat of the first call now shows `estado: "activa"` with a `fechaPublicacion` timestamp.

- [ ] **Step 4: Commit**

```bash
git add api/matriz/ediciones.ts api/matriz/publicar.ts
git commit -m "feat: add ediciones list/update and publicar endpoint"
```

---

## Task 11: Frontend API client and auth context

**Files:**
- Create: `Formulario_Convenio/src/matriz/api.ts`
- Create: `Formulario_Convenio/src/matriz/AuthContext.tsx`

**Interfaces:**
- Produces:
  - `api.get<T>(path: string): Promise<T>`, `api.post<T>(path, body): Promise<T>`, `api.put<T>(path, body): Promise<T>` — all `credentials: 'include'`, throw `ApiError` on non-2xx.
  - `<AuthProvider>` + `useAuth()` returning `{ user: {nombre, email} | null, loading: boolean, login(email,pw), logout() }` — consumed by Task 12's `MatrizApp`.

- [ ] **Step 1: Implement the API client**

```tsx
// Formulario_Convenio/src/matriz/api.ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'Error de red')
  return body as T
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T,>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
}
```

- [ ] **Step 2: Implement the auth context**

```tsx
// Formulario_Convenio/src/matriz/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, ApiError } from './api'

interface Usuario {
  nombre: string
  email: string
}

interface AuthValue {
  user: Usuario | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Usuario>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    await api.post('/auth/login', { email, password })
    const me = await api.get<Usuario>('/auth/me')
    setUser(me)
  }

  async function logout() {
    await api.post('/auth/logout', {})
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

export { ApiError }
```

- [ ] **Step 3: Commit**

```bash
git add src/matriz/api.ts src/matriz/AuthContext.tsx
git commit -m "feat: add Matriz de Tarifas API client and auth context"
```

---

## Task 12: Login screen, dashboard layout, and routing

**Files:**
- Create: `Formulario_Convenio/src/matriz/LoginScreen.tsx`
- Create: `Formulario_Convenio/src/matriz/DashboardLayout.tsx`
- Create: `Formulario_Convenio/src/matriz/MatrizApp.tsx`
- Modify: `Formulario_Convenio/src/main.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 11).
- Produces: `<MatrizApp>` — the full dashboard root, mounted at `/matriz-tarifas` by `main.tsx`. Renders `DashboardLayout` with a 3-tab menu (`'matriz' | 'propuesta' | 'historial'`) whose content Tasks 13-15 fill in.

- [ ] **Step 1: Implement the login screen**

```tsx
// Formulario_Convenio/src/matriz/LoginScreen.tsx
import { useState, type FormEvent } from 'react'
import { useAuth, ApiError } from './AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <img src="/logo_avanta_principal.png" alt="Avanta Hotel & Villas" className="h-12 mb-6" />
        <h1 className="text-xl font-semibold mb-1">Matriz de Tarifas</h1>
        <p className="text-sm text-gray-500 mb-6">Inicia sesión para continuar</p>

        <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        <label className="block text-sm font-medium mb-1" htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Implement the dashboard layout (logo + menu)**

```tsx
// Formulario_Convenio/src/matriz/DashboardLayout.tsx
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type MatrizTab = 'matriz' | 'propuesta' | 'historial'

const TABS: { key: MatrizTab; label: string }[] = [
  { key: 'matriz', label: 'Matriz actual' },
  { key: 'propuesta', label: 'Propuesta de aumento' },
  { key: 'historial', label: 'Historial de ediciones' },
]

export default function DashboardLayout({
  active,
  onChangeTab,
  children,
}: {
  active: MatrizTab
  onChangeTab: (tab: MatrizTab) => void
  children: ReactNode
}) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo_avanta_principal.png" alt="Avanta Hotel & Villas" className="h-9" />
          <span className="font-semibold text-gray-700">Matriz de Tarifas</span>
        </div>
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                active === tab.key ? 'bg-green text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{user?.nombre}</span>
          <button onClick={() => logout()} className="text-green-dark font-medium">
            Salir
          </button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Implement `MatrizApp` (auth gate + tab state)**

```tsx
// Formulario_Convenio/src/matriz/MatrizApp.tsx
import { useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import LoginScreen from './LoginScreen'
import DashboardLayout, { type MatrizTab } from './DashboardLayout'
import MatrizActual from './MatrizActual'
import PropuestaView from './PropuestaView'
import HistorialEdiciones from './HistorialEdiciones'

function MatrizAppInner() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<MatrizTab>('matriz')

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando…</div>
  if (!user) return <LoginScreen />

  return (
    <DashboardLayout active={tab} onChangeTab={setTab}>
      {tab === 'matriz' && <MatrizActual />}
      {tab === 'propuesta' && <PropuestaView />}
      {tab === 'historial' && <HistorialEdiciones />}
    </DashboardLayout>
  )
}

export default function MatrizApp() {
  return (
    <AuthProvider>
      <MatrizAppInner />
    </AuthProvider>
  )
}
```

- [ ] **Step 4: Wire up routing by pathname (no new router dependency)**

```tsx
// Formulario_Convenio/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import MatrizApp from './matriz/MatrizApp'

const isMatriz = window.location.pathname.startsWith('/matriz-tarifas')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isMatriz ? <MatrizApp /> : <App />}</StrictMode>,
)
```

- [ ] **Step 5: Add a Vercel rewrite so `/matriz-tarifas` doesn't 404 on refresh**

Create `Formulario_Convenio/vercel.json` (this repo has none yet, so zero-config Vite hosting currently serves only `index.html` at `/` — a direct load of `/matriz-tarifas` would 404 without this):

```json
{
  "rewrites": [{ "source": "/matriz-tarifas", "destination": "/index.html" }]
}
```

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`, open `http://localhost:5173/matriz-tarifas`
Expected: the login screen renders (logo, email/password fields); `http://localhost:5173/` still shows the original convenio form untouched.

- [ ] **Step 7: Commit**

```bash
git add src/matriz/LoginScreen.tsx src/matriz/DashboardLayout.tsx src/matriz/MatrizApp.tsx src/main.tsx vercel.json
git commit -m "feat: add login screen, dashboard layout/menu, and /matriz-tarifas routing"
```

---

## Task 13: `TarifaCard` — the editable grid component

**Files:**
- Create: `Formulario_Convenio/src/matriz/TarifaCard.tsx`

**Interfaces:**
- Consumes: `api` (Task 11), `paxColumnasPermitidas` is NOT imported here — capacity limiting is derived from which `pax` values are present per `tipoHabitacion` already returned by the API (Task 8 only ever returns rows within capacity, per Task 1's seed and Task 9's validation).
- Produces: `<TarifaCard tarifa={...} showPropuesta={boolean} onCellSaved={() => void} />` — used by Task 14 (`showPropuesta=false`) and Task 15 (`showPropuesta=true`).

- [ ] **Step 1: Implement the component**

```tsx
// Formulario_Convenio/src/matriz/TarifaCard.tsx
import { useState } from 'react'
import { api } from './api'

export interface TarifaValor {
  tipoHabitacion: string
  pax: number
  montoActual: number | null
  montoPropuesto: number | null
}

export interface TarifaPersonaExtra {
  tipoHabitacion: string
  montoActual: number | null
  montoPropuesto: number | null
}

export interface Tarifa {
  id: number
  nombre: string
  canales: string[]
  valores: TarifaValor[]
  personaExtra: TarifaPersonaExtra[]
}

const TIPOS_HABITACION = ['Sencilla King Hotel', 'Doble Queen Hotel', 'Sencilla King Villas', 'Doble Queen Villas']
const PAX_COLUMNAS = [1, 2, 3, 4]

// Capacidad fija por catálogo (Task 1's seed) — determina qué columnas de pax se
// habilitan por fila. Sencilla King: capacidad 3 → solo pax 1-3, pax 4 deshabilitada.
const CAPACIDAD_PERSONAS: Record<string, number> = {
  'Sencilla King Hotel': 3,
  'Doble Queen Hotel': 5,
  'Sencilla King Villas': 3,
  'Doble Queen Villas': 5,
}

function paxHabilitado(tipoHabitacion: string, pax: number): boolean {
  return pax <= Math.min(CAPACIDAD_PERSONAS[tipoHabitacion], 4)
}

function fmt(monto: number | null): string {
  return monto === null ? 'N/A' : `$${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

export default function TarifaCard({
  tarifa,
  showPropuesta,
  onCellSaved,
}: {
  tarifa: Tarifa
  showPropuesta: boolean
  onCellSaved: () => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function valorDe(tipoHabitacion: string, pax: number) {
    return tarifa.valores.find((v) => v.tipoHabitacion === tipoHabitacion && v.pax === pax) ?? null
  }

  function extraDe(tipoHabitacion: string) {
    return tarifa.personaExtra.find((e) => e.tipoHabitacion === tipoHabitacion) ?? null
  }

  async function guardarCelda(tipoHabitacion: string, pax: number, campo: 'montoActual' | 'montoPropuesto') {
    const nuevoMonto = draft.trim() === '' ? null : Number(draft)
    if (draft.trim() !== '' && Number.isNaN(nuevoMonto)) return setEditing(null)

    const actual = valorDe(tipoHabitacion, pax)
    await api.put('/matriz/tarifa-valores', {
      tarifaId: tarifa.id,
      tipoHabitacion,
      pax,
      montoActual: campo === 'montoActual' ? nuevoMonto : actual?.montoActual ?? null,
      montoPropuesto: campo === 'montoPropuesto' ? nuevoMonto : actual?.montoPropuesto ?? null,
    })
    setEditing(null)
    onCellSaved()
  }

  function celda(tipoHabitacion: string, pax: number, campo: 'montoActual' | 'montoPropuesto') {
    const key = `${tipoHabitacion}|${pax}|${campo}`
    const valor = valorDe(tipoHabitacion, pax)
    const monto = campo === 'montoActual' ? valor?.montoActual ?? null : valor?.montoPropuesto ?? null

    if (editing === key) {
      return (
        <input
          autoFocus
          className="w-24 border rounded px-1 py-0.5 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => guardarCelda(tipoHabitacion, pax, campo)}
          onKeyDown={(e) => e.key === 'Enter' && guardarCelda(tipoHabitacion, pax, campo)}
        />
      )
    }

    return (
      <button
        className="text-sm hover:underline"
        onClick={() => {
          setEditing(key)
          setDraft(monto === null ? '' : String(monto))
        }}
      >
        {fmt(monto)}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tarifa.nombre}</h3>
        <div className="flex gap-1">
          {tarifa.canales.map((c) => (
            <span key={c} className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">
              {c}
            </span>
          ))}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="font-normal">Tipo de habitación</th>
            {PAX_COLUMNAS.map((p) => (
              <th key={p} className="font-normal text-center">
                {p} pax{showPropuesta ? ' (act. / prop.)' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIPOS_HABITACION.map((tipo) => (
            <tr key={tipo} className="border-t">
              <td className="py-1.5">{tipo}</td>
              {PAX_COLUMNAS.map((pax) =>
                paxHabilitado(tipo, pax) ? (
                  <td key={pax} className="text-center">
                    {celda(tipo, pax, 'montoActual')}
                    {showPropuesta && <span className="mx-1 text-gray-300">/</span>}
                    {showPropuesta && celda(tipo, pax, 'montoPropuesto')}
                  </td>
                ) : (
                  <td key={pax} className="text-center text-gray-300" title="Fuera de la capacidad de esta habitación">
                    —
                  </td>
                ),
              )}
            </tr>
          ))}
          <tr className="border-t text-gray-500">
            <td className="py-1.5">Persona extra</td>
            {PAX_COLUMNAS.map((pax) => (
              <td key={pax} className="text-center">
                {pax >= 4 &&
                  TIPOS_HABITACION.filter((t) => extraDe(t)).map((t) => (
                    <span key={t} className="block">
                      {fmt(extraDe(t)!.montoActual)}
                    </span>
                  ))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/matriz/TarifaCard.tsx
git commit -m "feat: add editable TarifaCard grid component"
```

---

## Task 14: `MatrizActual` view and "+ módulo" modal

**Files:**
- Create: `Formulario_Convenio/src/matriz/MatrizActual.tsx`
- Create: `Formulario_Convenio/src/matriz/NuevoModuloModal.tsx`

**Interfaces:**
- Consumes: `api` (Task 11), `<TarifaCard>` (Task 13).
- Produces: `<MatrizActual>` — mounted by Task 12's `MatrizApp` for the `'matriz'` tab. This is the primary deliverable Ricardo asked for: view + create modules.

- [ ] **Step 1: Implement the "+" modal**

```tsx
// Formulario_Convenio/src/matriz/NuevoModuloModal.tsx
import { useEffect, useState, type FormEvent } from 'react'
import { api } from './api'

interface Canal {
  id: number
  nombre: string
}

export default function NuevoModuloModal({
  edicionId,
  onClose,
  onCreated,
}: {
  edicionId: number
  onClose: () => void
  onCreated: () => void
}) {
  const [canales, setCanales] = useState<Canal[]>([])
  const [nombre, setNombre] = useState('')
  const [canalIds, setCanalIds] = useState<number[]>([])
  const [nuevoCanal, setNuevoCanal] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<Canal[]>('/matriz/canales').then(setCanales)
  }, [])

  function toggleCanal(id: number) {
    setCanalIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function agregarCanal() {
    if (!nuevoCanal.trim()) return
    const canal = await api.post<Canal>('/matriz/canales', { nombre: nuevoCanal.trim() })
    setCanales((prev) => [...prev, canal])
    setCanalIds((prev) => [...prev, canal.id])
    setNuevoCanal('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || canalIds.length === 0) return
    setSaving(true)
    await api.post('/matriz/tarifas', { edicionId, nombre: nombre.trim(), canalIds })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="font-semibold text-lg mb-4">Nuevo módulo de tarifa</h2>

        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="ej. Airbnb Sin Desayuno"
          className="w-full border rounded-lg px-3 py-2 mb-4"
          required
        />

        <label className="block text-sm font-medium mb-1">Canales</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {canales.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => toggleCanal(c.id)}
              className={`text-sm rounded-full px-3 py-1 border ${
                canalIds.includes(c.id) ? 'bg-green text-white border-green' : 'text-gray-600'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={nuevoCanal}
            onChange={(e) => setNuevoCanal(e.target.value)}
            placeholder="Agregar canal nuevo"
            className="flex-1 border rounded-lg px-3 py-1 text-sm"
          />
          <button type="button" onClick={agregarCanal} className="text-sm font-medium text-green-dark">
            + Canal
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-green text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Creando…' : 'Crear módulo'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Implement `MatrizActual`**

```tsx
// Formulario_Convenio/src/matriz/MatrizActual.tsx
import { useEffect, useState } from 'react'
import { api } from './api'
import TarifaCard, { type Tarifa } from './TarifaCard'
import NuevoModuloModal from './NuevoModuloModal'

// ponytail: hardcoded — solo existe la edición 2026 (id 1) hasta que se cree la de 2027.
// Cuando exista más de una edición 'borrador', reemplazar por un selector que lea
// GET /api/matriz/ediciones y tome la de estado 'borrador' más reciente.
const EDICION_ACTIVA_ID = 1

export default function MatrizActual() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [filtroCanal, setFiltroCanal] = useState<string | null>(null)

  async function cargar() {
    const data = await api.get<Tarifa[]>(`/matriz/tarifas?edicionId=${EDICION_ACTIVA_ID}`)
    setTarifas(data)
  }

  useEffect(() => {
    cargar()
  }, [])

  const canales = Array.from(new Set(tarifas.flatMap((t) => t.canales))).sort()
  const visibles = filtroCanal ? tarifas.filter((t) => t.canales.includes(filtroCanal)) : tarifas

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroCanal(null)}
            className={`text-sm px-3 py-1 rounded-full ${!filtroCanal ? 'bg-green text-white' : 'bg-white border'}`}
          >
            Todos
          </button>
          {canales.map((c) => (
            <button
              key={c}
              onClick={() => setFiltroCanal(c)}
              className={`text-sm px-3 py-1 rounded-full ${filtroCanal === c ? 'bg-green text-white' : 'bg-white border'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-green text-white rounded-lg px-4 py-2 text-sm font-medium">
          + Nuevo módulo
        </button>
      </div>

      <div className="grid gap-4">
        {visibles.map((t) => (
          <TarifaCard key={t.id} tarifa={t} showPropuesta={false} onCellSaved={cargar} />
        ))}
      </div>

      {modalOpen && (
        <NuevoModuloModal
          edicionId={EDICION_ACTIVA_ID}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false)
            cargar()
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Manual smoke test**

Run: `vercel dev`, log in at `/matriz-tarifas`
Expected: 10 cards render grouped/filterable by canal; clicking a price cell turns it into an input, typing a new value and pressing Enter or blurring saves it (confirmed by reloading and seeing the new value); "+ Nuevo módulo" opens the modal, picking/adding channels and submitting adds a new empty card.

- [ ] **Step 4: Commit**

```bash
git add src/matriz/MatrizActual.tsx src/matriz/NuevoModuloModal.tsx
git commit -m "feat: add Matriz actual view with módulo creation"
```

---

## Task 15: `PropuestaView`

**Files:**
- Create: `Formulario_Convenio/src/matriz/PropuestaView.tsx`

**Interfaces:**
- Consumes: `api`, `<TarifaCard showPropuesta>` (Task 13).
- Produces: `<PropuestaView>` — mounted by Task 12 for the `'propuesta'` tab.

- [ ] **Step 1: Implement the component**

```tsx
// Formulario_Convenio/src/matriz/PropuestaView.tsx
import { useEffect, useState } from 'react'
import { api } from './api'
import TarifaCard, { type Tarifa } from './TarifaCard'

// ponytail: same simplification as MatrizActual.tsx — single hardcoded edición until 2027 exists.
const EDICION_ACTIVA_ID = 1

interface Edicion {
  id: number
  anio: number
  aumentoDefaultMxn: number
}

export default function PropuestaView() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [aumentoDraft, setAumentoDraft] = useState('')

  async function cargar() {
    const [tarifasData, ediciones] = await Promise.all([
      api.get<Tarifa[]>(`/matriz/tarifas?edicionId=${EDICION_ACTIVA_ID}`),
      api.get<Edicion[]>('/matriz/ediciones'),
    ])
    setTarifas(tarifasData)
    const actual = ediciones.find((e) => e.id === EDICION_ACTIVA_ID) ?? null
    setEdicion(actual)
    if (actual) setAumentoDraft(String(actual.aumentoDefaultMxn))
  }

  useEffect(() => {
    cargar()
  }, [])

  async function guardarAumento() {
    const monto = Number(aumentoDraft)
    if (Number.isNaN(monto) || !edicion) return
    await api.put('/matriz/ediciones', { id: edicion.id, aumentoDefaultMxn: monto })
    cargar()
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow p-4 mb-4 flex items-center gap-3">
        <label className="text-sm font-medium">Aumento global (MXN)</label>
        <input
          value={aumentoDraft}
          onChange={(e) => setAumentoDraft(e.target.value)}
          className="w-24 border rounded px-2 py-1 text-sm"
        />
        <button onClick={guardarAumento} className="bg-green text-white rounded-lg px-3 py-1 text-sm">
          Aplicar a todas las celdas
        </button>
        <p className="text-xs text-gray-500">
          Se aplica a toda celda sin ajuste manual propio (columna "propuesta" en blanco).
        </p>
      </div>

      <div className="grid gap-4">
        {tarifas.map((t) => (
          <TarifaCard key={t.id} tarifa={t} showPropuesta onCellSaved={cargar} />
        ))}
      </div>
    </div>
  )
}
```

**Note:** the "aplicar a todas las celdas" action only changes `aumento_default_mxn` on the edición — cells with no `monto_propuesto` override already compute the increase on read via the `GET /api/matriz/tarifas` → `monto_propuesto` value only if Task 8's query is extended to fall back through `computeMontoPropuesto`. **Fix this now**, since Task 8 currently returns the raw (possibly-null) `monto_propuesto` column with no fallback:

- [ ] **Step 2: Apply the `computeMontoPropuesto` fallback in the tarifas GET handler**

In `Formulario_Convenio/api/matriz/tarifas.ts`, import `computeMontoPropuesto` and the edición's `aumento_default_mxn`, then replace the `valores.map` line:

```ts
// add near the top of the file
import { computeMontoPropuesto } from '../_lib/matrizCalc'

// inside the GET branch, right after fetching `tarifas`, also fetch the increase:
const { rows: edicionRows } = await pool.query('SELECT aumento_default_mxn FROM ediciones WHERE id = $1', [edicionId])
const aumentoDefault = edicionRows[0] ? Number(edicionRows[0].aumento_default_mxn) : 0

// replace the existing valores.map(...) inside `result` with:
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
```

- [ ] **Step 3: Manual smoke test**

Run: `vercel dev`, open the "Propuesta de aumento" tab
Expected: every "propuesta" cell shows "actual + 80" by default; changing the global aumento field and clicking "Aplicar" updates every non-overridden cell after reload; manually editing one "propuesta" cell in the grid keeps its own value even after the global aumento changes again.

- [ ] **Step 4: Commit**

```bash
git add src/matriz/PropuestaView.tsx api/matriz/tarifas.ts
git commit -m "feat: add PropuestaView with global aumento + per-cell override"
```

---

## Task 16: `HistorialEdiciones` and publish wiring

**Files:**
- Create: `Formulario_Convenio/src/matriz/HistorialEdiciones.tsx`

**Interfaces:**
- Consumes: `api` (Task 11), `GET/POST /api/matriz/ediciones` and `/api/matriz/publicar` (Task 10).

- [ ] **Step 1: Implement the component**

```tsx
// Formulario_Convenio/src/matriz/HistorialEdiciones.tsx
import { useEffect, useState } from 'react'
import { api } from './api'

interface Edicion {
  id: number
  anio: number
  estado: 'borrador' | 'activa' | 'archivada'
  aumentoDefaultMxn: number
  fechaPublicacion: string | null
}

function descargar(nombre: string, contenido: unknown) {
  const blob = new Blob([JSON.stringify(contenido, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

export default function HistorialEdiciones() {
  const [ediciones, setEdiciones] = useState<Edicion[]>([])
  const [publicando, setPublicando] = useState<number | null>(null)

  async function cargar() {
    setEdiciones(await api.get<Edicion[]>('/matriz/ediciones'))
  }

  useEffect(() => {
    cargar()
  }, [])

  async function publicar(edicionId: number) {
    setPublicando(edicionId)
    const { tarifasJson, tarifasCotizadorJson } = await api.post<{ tarifasJson: unknown; tarifasCotizadorJson: unknown }>(
      '/matriz/publicar',
      { edicionId },
    )
    descargar('tarifas.json', tarifasJson)
    descargar('tarifas-cotizador.json', tarifasCotizadorJson)
    setPublicando(null)
    cargar()
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="font-normal">Año</th>
            <th className="font-normal">Estado</th>
            <th className="font-normal">Aumento default</th>
            <th className="font-normal">Publicada</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ediciones.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-2">{e.anio}</td>
              <td className="capitalize">{e.estado}</td>
              <td>${e.aumentoDefaultMxn.toLocaleString('es-MX')}</td>
              <td>{e.fechaPublicacion ? new Date(e.fechaPublicacion).toLocaleDateString('es-MX') : '—'}</td>
              <td className="text-right">
                {e.estado === 'borrador' && (
                  <button
                    onClick={() => publicar(e.id)}
                    disabled={publicando === e.id}
                    className="bg-green text-white rounded-lg px-3 py-1 text-xs disabled:opacity-50"
                  >
                    {publicando === e.id ? 'Publicando…' : 'Publicar edición'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-3">
        Publicar descarga <code>tarifas.json</code> y <code>tarifas-cotizador.json</code> — colócalos manualmente en
        <code> convenios-avanta-2026/api/</code> y <code>cotizacion-avanta/api/</code> respectivamente.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Manual smoke test**

Run: `vercel dev`, open the "Historial de ediciones" tab, click "Publicar edición" on the 2026 row
Expected: two files download (`tarifas.json`, `tarifas-cotizador.json`); the row now shows `estado: activa` with today's date; the button disappears (only `borrador` rows show it).

- [ ] **Step 3: Commit**

```bash
git add src/matriz/HistorialEdiciones.tsx
git commit -m "feat: add HistorialEdiciones view with publish + export download"
```

---

## Task 17: PDF de la propuesta (Python + ReportLab)

**Files:**
- Create: `Formulario_Convenio/api/matriz/generar-pdf-propuesta.py`

**Interfaces:**
- Consumes: POST body `{ anio, tarifas: TarifaConValores[] }` (same shape Task 3's `buildTarifasJson` input uses, sent directly from the frontend after Task 16's "Publicar" — this task only needs the raw list, no DB access).
- Produces: `POST /api/matriz/generar-pdf-propuesta` → PDF bytes (base64), reusing the Kodchasan font and layout conventions from `convenios-avanta-2026/api/generar-convenio-pdf.py`.

- [ ] **Step 1: Implement the function**

```python
# Formulario_Convenio/api/matriz/generar-pdf-propuesta.py
"""Genera un PDF de la propuesta de aumento de tarifas (actual vs. propuesta)."""
from http.server import BaseHTTPRequestHandler
import json, os, base64
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

VERDE = HexColor('#7FA44A')
GRIS = HexColor('#888888')
NEGRO = HexColor('#333333')


def registrar_fuente(dir_api):
    try:
        pdfmetrics.registerFont(TTFont('Kodchasan', os.path.join(dir_api, '..', '..', 'Kodchasan-Medium.ttf')))
        return 'Kodchasan'
    except Exception:
        return 'Helvetica'


def fmt(v):
    return 'N/A' if v is None else f"${v:,.2f}"


def crear_pdf(anio, tarifas):
    dir_api = os.path.dirname(os.path.abspath(__file__))
    fuente = registrar_fuente(dir_api)
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 60

    c.setFont(fuente, 18)
    c.setFillColor(NEGRO)
    c.drawString(50, y, f"Propuesta de aumento de tarifas — {anio}")
    y -= 30

    for tarifa in tarifas:
        if y < 120:
            c.showPage()
            y = height - 60
        c.setFont(fuente, 12)
        c.setFillColor(VERDE)
        c.drawString(50, y, tarifa['nombre'])
        y -= 16

        c.setFont(fuente, 9)
        c.setFillColor(GRIS)
        c.drawString(60, y, 'Tipo de habitación')
        c.drawString(220, y, 'Pax')
        c.drawString(260, y, 'Actual')
        c.drawString(330, y, 'Propuesta')
        y -= 14

        for valor in tarifa['valores']:
            c.setFillColor(NEGRO)
            c.drawString(60, y, valor['tipoHabitacion'])
            c.drawString(220, y, str(valor['pax']))
            c.drawString(260, y, fmt(valor.get('montoActual')))
            c.drawString(330, y, fmt(valor.get('montoPropuesto')))
            y -= 13
        y -= 10

    c.save()
    return buffer.getvalue()


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            datos = json.loads(self.rfile.read(length))
            pdf_bytes = crear_pdf(datos.get('anio'), datos.get('tarifas', []))
            resp = {'success': True, 'pdfBase64': base64.b64encode(pdf_bytes).decode('utf-8')}
            self.send_response(200)
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(resp).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        pass
```

- [ ] **Step 2: Add `requirements.txt` for this function** (Vercel Python functions need their own)

```
reportlab==4.0.9
```

Create `Formulario_Convenio/requirements.txt` with that line, matching the version pin used in the other Avanta repos.

- [ ] **Step 3: Manual smoke test**

```bash
curl -s -X POST http://localhost:3000/api/matriz/generar-pdf-propuesta \
  -H 'Content-Type: application/json' \
  -d '{"anio":2026,"tarifas":[{"nombre":"Convenio Avanta Sin Desayuno","valores":[{"tipoHabitacion":"Sencilla King Hotel","pax":1,"montoActual":800,"montoPropuesto":880}]}]}' \
  | python3 -c "import json,sys,base64; d=json.load(sys.stdin); open('/tmp/propuesta.pdf','wb').write(base64.b64decode(d['pdfBase64']))"
```
Expected: `/tmp/propuesta.pdf` opens and shows the title, the módulo name in green, and one row with `$800.00` / `$880.00`.

- [ ] **Step 4: Wire the download button in `HistorialEdiciones`**

In `Formulario_Convenio/src/matriz/HistorialEdiciones.tsx`, extend `publicar` to also request and download the PDF:

```ts
// add inside publicar(), right after the two JSON downloads:
const pdfResp = await fetch('/api/matriz/generar-pdf-propuesta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ anio: ediciones.find((e) => e.id === edicionId)?.anio, tarifas: [] }),
}).then((r) => r.json())
const pdfBlob = new Blob([Uint8Array.from(atob(pdfResp.pdfBase64), (c) => c.charCodeAt(0))], { type: 'application/pdf' })
const pdfUrl = URL.createObjectURL(pdfBlob)
const a = document.createElement('a')
a.href = pdfUrl
a.download = `Propuesta_Tarifas_${ediciones.find((e) => e.id === edicionId)?.anio}.pdf`
a.click()
URL.revokeObjectURL(pdfUrl)
```

(The `tarifas: []` placeholder must be replaced with the real per-tarifa `valores` — reuse the same `GET /api/matriz/tarifas?edicionId=` call already made in `MatrizActual`/`PropuestaView` and pass its result through; wire this the same way `PropuestaView` already fetches `tarifas`.)

- [ ] **Step 5: Commit**

```bash
git add api/matriz/generar-pdf-propuesta.py requirements.txt src/matriz/HistorialEdiciones.tsx
git commit -m "feat: add PDF export for the tarifa increase proposal"
```

---

## Task 18: Refactor `cotizacion-avanta` to read `tarifas-cotizador.json`

**Files:**
- Modify: `cotizacion-avanta/api/generar-cotizacion-pdf.py`
- Create: `cotizacion-avanta/api/tarifas-cotizador.json` (placeholder committed with today's hardcoded values, so the fallback path is exercised identically to before until Ricardo drops in a real export)

**Interfaces:** None external — this only changes where the `TARIFAS` dict's values come from, not its shape.

- [ ] **Step 1: Write the placeholder JSON** (values copied from the current hardcoded `TARIFAS` dict, so behavior is unchanged until Ricardo publishes a new edición)

`cotizacion-avanta/api/tarifas-cotizador.json` — copy the full existing `TARIFAS` dict from `generar-cotizacion-pdf.py:86-127`, converting Python `dict` syntax to JSON (double-quoted keys, no trailing commas).

- [ ] **Step 2: Replace the hardcoded dict with a loader**

In `cotizacion-avanta/api/generar-cotizacion-pdf.py`, replace lines 86-127 (`TARIFAS = { ... }`) with:

```python
import json as _json

_DEFAULT_TARIFAS = {
    "Con Convenio": {
        "Sin Desayuno": {
            "Sencilla King Hotel":  {1:800,2:800,3:900},
            "Doble Queen Hotel":    {1:1000,2:1000,3:1100,4:1200,5:1300},
            "Sencilla King Villa":  {1:700,2:700},
            "Doble Queen Villa":    {1:900,2:900,3:1000,4:1100,5:1200},
        },
        "Con Desayuno Buffet": {
            "Sencilla King Hotel":  {1:1040,2:1280,3:1520},
            "Doble Queen Hotel":    {1:1480,2:1480,3:1720,4:1960,5:2200},
            "Sencilla King Villa":  {1:940,2:1180},
            "Doble Queen Villa":    {1:1380,2:1380,3:1620,4:1860,5:2100},
        },
        "Con Desayuno Americano": {
            "Sencilla King Hotel":  {1:965,2:1130,3:1295},
            "Doble Queen Hotel":    {1:1165,2:1330,3:1495,4:1660,5:1825},
            "Sencilla King Villa":  {1:865,2:1030},
            "Doble Queen Villa":    {1:1065,2:1230,3:1395,4:1560,5:1725},
        },
    },
    "Sin Convenio": {
        "Sin Desayuno": {
            "Sencilla King Hotel":  {1:850,2:850,3:950},
            "Doble Queen Hotel":    {1:1050,2:1050,3:1150,4:1250,5:2350},
            "Sencilla King Villa":  {1:750,2:750},
            "Doble Queen Villa":    {1:950,2:950,3:1050,4:1150,5:1250},
        },
        "Con Desayuno Buffet": {
            "Sencilla King Hotel":  {1:1090,2:1330,3:1570},
            "Doble Queen Hotel":    {1:1530,2:1530,3:1770,4:2010,5:2250},
            "Sencilla King Villa":  {1:990,2:1230},
            "Doble Queen Villa":    {1:1190,2:1430,3:1670,4:1910,5:2150},
        },
        "Con Desayuno Americano": {
            "Sencilla King Hotel":  {1:1015,2:1180,3:1345},
            "Doble Queen Hotel":    {1:1215,2:1380,3:1545,4:1710,5:1875},
            "Sencilla King Villa":  {1:915,2:1080},
            "Doble Queen Villa":    {1:1115,2:1280,3:1445,4:1610,5:1775},
        },
    },
}


def _cargar_tarifas():
    try:
        dir_api = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(dir_api, 'tarifas-cotizador.json'), 'r', encoding='utf-8') as f:
            data = _json.load(f)
        # JSON object keys are always strings; pax needs to be int to match get_precio()'s lookups
        return {
            grupo: {
                desayuno: {
                    tipo: {int(pax): monto for pax, monto in paxes.items()}
                    for tipo, paxes in tipos.items()
                }
                for desayuno, tipos in desayunos.items()
            }
            for grupo, desayunos in data.items()
        }
    except Exception as e:
        print(f"tarifas-cotizador.json no disponible ({e}); usando valores por defecto")
        return _DEFAULT_TARIFAS


TARIFAS = _cargar_tarifas()
```

- [ ] **Step 2: Verify `os` is imported** (check the top of the file — it already is, line 12, so no change needed there)

- [ ] **Step 3: Manual smoke test**

```bash
cd cotizacion-avanta
python3 -c "
import sys; sys.path.insert(0, 'api')
import importlib.util
spec = importlib.util.spec_from_file_location('m', 'api/generar-cotizacion-pdf.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
print(m.get_precio('Con Convenio', 'Sin Desayuno', 'Sencilla King Hotel', 1))
"
```
Expected: prints `800` (loaded from `tarifas-cotizador.json`, matching the placeholder).

Then temporarily rename `tarifas-cotizador.json` and re-run the same command — expected: still prints `800`, now via `_DEFAULT_TARIFAS`, confirming the fallback works before you restore the file.

- [ ] **Step 4: Commit**

```bash
cd cotizacion-avanta
git add api/generar-cotizacion-pdf.py api/tarifas-cotizador.json
git commit -m "feat: load TARIFAS from tarifas-cotizador.json with hardcoded fallback"
```

---

## Post-plan checklist (not code — infrastructure Ricardo does outside this repo)

- [ ] Provision `avanta-db` (Postgres) in EasyPanel, matching the `promosolution-db` pattern.
- [ ] Set `DATABASE_URL` and `SESSION_SECRET` as environment variables on the `Formulario_Convenio` Vercel project.
- [ ] Run Task 1's `schema.sql` + `seed.sql` and Task 6 Step 4's user-seeding script against the real `avanta-db`.
- [ ] Turn off GitHub Pages for this repo in GitHub Settings → Pages (see Task 0's note).
