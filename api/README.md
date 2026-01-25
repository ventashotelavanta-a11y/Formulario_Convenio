# API de Generación de Convenios PDF

## 📄 Descripción

API Node.js que genera convenios personalizados en formato PDF usando PDFKit.

## 🚀 Instalación

### Requisitos 

- Node.js 14 o superior
- npm o yarn

### Paso 1: Instalar dependencias

```bash
cd api/
npm install
```

Esto instalará:
- `express` - Framework web
- `pdfkit` - Generador de PDFs
- `cors` - Manejo de CORS

### Paso 2: Configurar (opcional)

Puedes modificar el puerto en `generar-convenio.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

O usar una variable de entorno:

```bash
export PORT=8080
```

### Paso 3: Iniciar la API

**Modo desarrollo:**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

**Con PM2 (recomendado para producción):**
```bash
# Instalar PM2
npm install -g pm2

# Iniciar
npm run pm2:start

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Detener
npm run pm2:stop
```

## 🔌 Endpoints

### POST /generar-convenio

Genera un convenio en PDF.

**Request:**
```json
{
  "numeroConvenio": "CNV-1705488600000",
  "cliente": {
    "nombre": "Juan",
    "apellidos": "Pérez",
    "nombreCompleto": "Juan Pérez",
    "email": "juan@empresa.com",
    "telefono": "+52 55 1234 5678",
    "empresa": "Empresa ABC",
    "empresaNormalizada": "EMPRESA ABC"
  },
  "fecha": "2025-01-17"
}
```

**Response exitosa:**
```json
{
  "success": true,
  "message": "Convenio generado exitosamente",
  "numeroConvenio": "CNV-1705488600000",
  "fileName": "Convenio_CNV-1705488600000_EMPRESA_ABC.pdf",
  "filePath": "/ruta/completa/convenios/Convenio_CNV-1705488600000_EMPRESA_ABC.pdf",
  "pdfUrl": "https://tu-servidor.com/convenios/Convenio_CNV-1705488600000_EMPRESA_ABC.pdf",
  "cliente": { /* datos del cliente */ }
}
```

**Response error:**
```json
{
  "error": "Faltan datos requeridos",
  "required": ["numeroConvenio", "cliente", "fecha"]
}
```

### GET /convenios/:filename

Sirve un PDF generado.

**Ejemplo:**
```
GET https://tu-api.com/convenios/Convenio_CNV-1705488600000_EMPRESA_ABC.pdf
```

## 🧪 Pruebas

### Probar con curl:

```bash
curl -X POST http://localhost:3000/generar-convenio \
  -H "Content-Type: application/json" \
  -d '{
    "numeroConvenio": "CNV-TEST-001",
    "cliente": {
      "nombre": "Juan",
      "apellidos": "Pérez",
      "nombreCompleto": "Juan Pérez",
      "email": "juan@test.com",
      "telefono": "+52 55 1234 5678",
      "empresa": "Empresa Test",
      "empresaNormalizada": "EMPRESA TEST"
    },
    "fecha": "2025-01-17"
  }'
```

### Probar con Postman:

1. Crea una nueva request POST
2. URL: `http://localhost:3000/generar-convenio`
3. Headers: `Content-Type: application/json`
4. Body: Copia el JSON de arriba
5. Send

### Ver el PDF generado:

```bash
# Listar PDFs generados
ls -la convenios/

# Abrir un PDF
open convenios/Convenio_CNV-TEST-001_EMPRESA_TEST.pdf
```

## 🎨 Personalización del PDF

### Estructura del PDF

El convenio incluye:

1. **Encabezado**
   - Logo de Avanta (opcional)
   - Título "CONVENIO EMPRESARIAL"
   - Número de convenio y fecha

2. **Datos de la Empresa**
   - Razón social
   - Representante legal
   - Email corporativo
   - Teléfono

3. **Objeto del Convenio**
   - Descripción del propósito

4. **Beneficios y Condiciones**
   - Lista de 8 beneficios corporativos

5. **Condiciones Generales**
   - 5 términos principales

6. **Vigencia**
   - Fechas de inicio y fin (12 meses)

7. **Firmas**
   - Espacio para firma del cliente
   - Espacio para firma de Avanta

8. **Footer**
   - Información de contacto

### Modificar el diseño

Edita `generar-convenio.js` en las siguientes secciones:

**Colores:**
```javascript
// Línea ~50
doc.fillColor('#7FA44A')  // Verde Avanta
doc.fillColor('#000000')  // Negro para texto
doc.fillColor('#666666')  // Gris para subtítulos
```

**Tipografía:**
```javascript
// Tamaños de fuente
doc.fontSize(24)  // Títulos principales
doc.fontSize(14)  // Subtítulos
doc.fontSize(11)  // Texto normal
```

**Añadir logo:**
```javascript
// Línea ~52
doc.image('logo_avanta.png', 50, 45, { width: 100 });
```

**Modificar beneficios:**
```javascript
// Línea ~120
const beneficios = [
  'Tu nuevo beneficio aquí',
  'Otro beneficio personalizado',
  // ... más beneficios
];
```

### Cambiar el nombre del archivo

```javascript
// Línea ~40
const fileName = `Convenio_${numeroConvenio}_${cliente.empresaNormalizada}.pdf`;
```

Puedes cambiarlo a:
```javascript
const fileName = `${cliente.empresaNormalizada}_Convenio_${fecha}.pdf`;
```

## 🌐 Despliegue

### Opción 1: VPS (Digital Ocean, Linode, AWS EC2)

```bash
# Conectar por SSH
ssh usuario@tu-servidor.com

# Clonar el repositorio
git clone https://github.com/tu-usuario/convenios-avanta.git
cd convenios-avanta/api

# Instalar dependencias
npm install

# Iniciar con PM2
pm2 start generar-convenio.js --name convenios-api
pm2 startup
pm2 save
```

### Opción 2: Heroku

```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Crear app
heroku create avanta-convenios-api

# Desplegar
git push heroku main

# Ver logs
heroku logs --tail
```

### Opción 3: Vercel

1. Instala Vercel CLI: `npm i -g vercel`
2. En la carpeta `api/`: `vercel`
3. Sigue las instrucciones

### Opción 4: Railway

1. Ve a https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Selecciona tu repositorio
4. Railway detectará Node.js automáticamente

## 🔐 Seguridad

### Añadir autenticación

Edita `generar-convenio.js`:

```javascript
// Middleware de autenticación
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  next();
});
```

Luego en n8n, añade el header:
```
X-API-Key: tu-clave-secreta
```

### Variables de entorno

Crea un archivo `.env`:

```bash
PORT=3000
API_KEY=tu-clave-secreta-aqui
PDF_STORAGE_PATH=/ruta/donde/guardar/pdfs
BASE_URL=https://tu-dominio.com
```

Instala dotenv:
```bash
npm install dotenv
```

Y úsalo en el código:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

## 🔧 Nginx como Proxy Reverso

Si usas Nginx:

```nginx
server {
    listen 80;
    server_name api.avantahotel.com.mx;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /convenios {
        alias /ruta/completa/a/convenios;
        autoindex off;
    }
}
```

## 📊 Monitoreo

### Ver logs con PM2

```bash
pm2 logs convenios-api
pm2 logs convenios-api --lines 100
```

### Monitoreo en tiempo real

```bash
pm2 monit
```

### Estadísticas

```bash
pm2 status
```

## 🐛 Solución de Problemas

### Error: Cannot find module 'pdfkit'

```bash
npm install pdfkit --save
```

### Error: ENOENT: no such file or directory

La carpeta `convenios/` no existe:

```bash
mkdir convenios
chmod 755 convenios
```

### Error: Port 3000 already in use

Cambia el puerto:

```bash
PORT=8080 npm start
```

O detén el proceso que usa el puerto:

```bash
lsof -i :3000
kill -9 [PID]
```

### PDFs corruptos

Verifica que:
1. ✅ PDFKit esté correctamente instalado
2. ✅ El directorio `convenios/` tenga permisos de escritura
3. ✅ El método `doc.end()` se ejecute

## 📦 Dependencias

```json
{
  "express": "^4.18.2",    // Framework web
  "pdfkit": "^0.13.0",     // Generador de PDFs
  "cors": "^2.8.5"         // Manejo de CORS
}
```

## 📞 Soporte

Para problemas con la API:

- 📧 comercial@avantahotel.com.mx
- 📖 [Documentación de PDFKit](https://pdfkit.org/docs/getting_started.html)
- 📖 [Documentación de Express](https://expressjs.com/)

---

[← Volver al README principal](../README.md)
