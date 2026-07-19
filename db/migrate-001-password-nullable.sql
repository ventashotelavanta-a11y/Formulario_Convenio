-- La tabla usuarios ya se creó con password_hash NOT NULL (db/schema.sql previo a este cambio).
-- Isabel necesita poder entrar sin contraseña asignada y definirla en su primer login.
ALTER TABLE usuarios ALTER COLUMN password_hash DROP NOT NULL;
