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

// Sin 0/O/1/l/I para que se lea y se transcriba sin ambigüedad al compartirla con Isabel.
function generarTemporal(longitud = 12) {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from(randomBytes(longitud), (b) => alfabeto[b % alfabeto.length]).join('')
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
console.log('Nota: lo que escribas aparecerá en pantalla (esta terminal no oculta el texto).')
const ricardoPassword = await rl.question('Contraseña para Ricardo (comercial@avantahotel.com.mx): ')
rl.close()

const isabelPasswordTemporal = generarTemporal()

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
try {
  await client.connect()
  await client.query(
    'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1,$2,$3)',
    ['Ricardo', 'comercial@avantahotel.com.mx', hashPassword(ricardoPassword)],
  )
  await client.query(
    'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1,$2,$3)',
    ['Isabel', 'gerencia@avantahotel.com.mx', hashPassword(isabelPasswordTemporal)],
  )
  console.log('Usuarios creados correctamente.')
  console.log(`Contraseña temporal de Isabel (gerencia@avantahotel.com.mx): ${isabelPasswordTemporal}`)
  console.log('Compártesela para que inicie sesión, y dile que la cambie desde el menú "Cambiar contraseña".')
} catch (err) {
  console.error('Error creando usuarios:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
