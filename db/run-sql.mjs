import { readFileSync } from 'node:fs'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('Uso: node db/run-sql.mjs <archivo.sql>')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('Falta la variable de entorno DATABASE_URL')
  process.exit(1)
}

const sql = readFileSync(file, 'utf8')
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
})

try {
  await client.connect()
  await client.query(sql)
  console.log(`OK: ${file} ejecutado correctamente`)
} catch (err) {
  console.error(`Error ejecutando ${file}:`, err.message)
  process.exit(1)
} finally {
  await client.end()
}
