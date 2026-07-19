import { scryptSync, randomBytes } from 'node:crypto'
import readline from 'node:readline/promises'
import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('Falta la variable de entorno DATABASE_URL')
  process.exit(1)
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
console.log('Nota: lo que escribas aparecerá en pantalla (esta terminal no oculta el texto).')
const ricardoPassword = await rl.question('Contraseña para Ricardo (comercial@avantahotel.com.mx): ')
rl.close()

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
try {
  await client.connect()
  await client.query(
    'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1,$2,$3)',
    ['Ricardo', 'comercial@avantahotel.com.mx', hashPassword(ricardoPassword)],
  )
  // Isabel: sin contraseña todavía -- la define ella misma en su primer login.
  await client.query(
    'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1,$2,$3)',
    ['Isabel', 'gerencia@avantahotel.com.mx', null],
  )
  console.log('Usuarios creados correctamente.')
} catch (err) {
  console.error('Error creando usuarios:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
