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
