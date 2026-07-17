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
