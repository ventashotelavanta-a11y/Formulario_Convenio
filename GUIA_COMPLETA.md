# Guía Completa: Sistema de Convenios Avanta con n8n

## 📋 Índice
1. [Resumen del Sistema](#resumen-del-sistema)
2. [Requisitos Previos](#requisitos-previos)
3. [Configuración del HTML](#configuración-del-html)
4. [Configuración de n8n](#configuración-de-n8n)
5. [Configuración de la API de PDF](#configuración-de-la-api-de-pdf)
6. [Configuración de Email](#configuración-de-email)
7. [Flujo Completo](#flujo-completo)
8. [Pruebas](#pruebas)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen del Sistema

El sistema completo consta de 4 componentes principales:

```
FORMULARIO WEB → n8n WORKFLOW → API PDF → EMAIL
     ↓              ↓              ↓         ↓
  Usuario      Normaliza      Genera    Envía al
  completa     y valida      convenio   cliente
  el form      los datos       PDF     y equipo
```

### Flujo de datos:

1. **Usuario completa el formulario** en el sitio web
2. **Datos se envían al webhook de n8n** via POST
3. **n8n normaliza y valida** los datos (nombres en mayúsculas, emails en minúsculas, etc.)
4. **n8n verifica** que los datos estén completos y válidos
5. **n8n llama a la API** para generar el PDF del convenio
6. **API genera el PDF** con los datos del cliente
7. **n8n envía el email** al cliente con el convenio adjunto
8. **n8n notifica** al equipo comercial sobre la nueva solicitud
9. **n8n responde al formulario** confirmando el éxito

---

## 📦 Requisitos Previos

### Para el formulario HTML:
- Servidor web (Apache, Nginx, o hosting)
- Logo de Avanta (`logo_avanta_principal.png`)

### Para n8n:
- Cuenta de n8n (cloud o self-hosted)
- Acceso a crear workflows

### Para la API de PDF:
- Node.js v14 o superior
- npm o yarn
- Servidor donde alojar la API

### Para el email:
- Servidor SMTP o cuenta de email (Gmail, Office365, etc.)
- Credenciales SMTP

---

## 🌐 Configuración del HTML

### Paso 1: Subir archivos
Sube estos archivos a tu servidor web:
- `index_n8n.html`
- `logo_avanta_principal.png`

### Paso 2: Configurar URL de n8n
En `index_n8n.html`, línea 428, cambia:

```javascript
const N8N_WEBHOOK_URL = "https://TU_INSTANCIA_N8N.app.n8n.cloud/webhook/convenio-avanta";
```

Por tu URL real de n8n (la obtendrás en el siguiente paso).

---

## ⚙️ Configuración de n8n

### Paso 1: Importar el workflow

1. Abre tu instancia de n8n
2. Ve a **Workflows** > **Add workflow**
3. Haz clic en el menú (⋮) > **Import from File**
4. Selecciona `workflow_n8n_convenio.json`
5. El workflow se importará con todos los nodos

### Paso 2: Configurar el Webhook

1. Haz clic en el nodo **"Webhook - Recibir Formulario"**
2. Copia la **URL del Webhook** (Production URL)
3. Pégala en el HTML (paso anterior)
4. Guarda el nodo

### Paso 3: Configurar credenciales SMTP

1. Ve a **Credentials** > **Add Credential**
2. Selecciona **SMTP**
3. Configura:
   ```
   Host: smtp.gmail.com (o tu servidor SMTP)
   Port: 587
   User: comercial@avantahotel.com.mx
   Password: [tu contraseña o app password]
   ```
4. Guarda las credenciales
5. En los nodos de email, selecciona estas credenciales

### Paso 4: Configurar la API de PDF

En el nodo **"Generar Convenio PDF"**, cambia la URL:

```
https://TU_API_CONVENIOS/generar-convenio
```

Por la URL donde alojes tu API (siguiente sección).

### Paso 5: Activar el workflow

1. Haz clic en el switch de **Inactive/Active** en la esquina superior derecha
2. El workflow ahora estará escuchando en el webhook

---

## 🖨️ Configuración de la API de PDF

### Opción A: API Node.js (Recomendada)

#### Paso 1: Instalar dependencias

```bash
npm init -y
npm install express pdfkit
```

#### Paso 2: Usar el archivo proporcionado

Guarda el archivo `api-generar-convenio.js` en tu servidor.

#### Paso 3: Iniciar la API

```bash
node api-generar-convenio.js
```

O usa PM2 para mantenerla corriendo:

```bash
npm install -g pm2
pm2 start api-generar-convenio.js --name "convenios-api"
pm2 save
```

#### Paso 4: Configurar dominio

Si usas Nginx, crea un proxy:

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opción B: Usar un servicio de generación de PDFs

Si prefieres no alojar tu propia API, puedes usar servicios como:

1. **PDFMonkey** (https://pdfmonkey.io)
2. **DocRaptor** (https://docraptor.com)
3. **PDF.co** (https://pdf.co)

Estos servicios tienen APIs REST similares y puedes configurarlos directamente en n8n.

---

## 📧 Configuración de Email

### Opción 1: Gmail (más fácil)

1. Crea una cuenta Gmail para el hotel
2. Activa "Verificación en 2 pasos"
3. Genera una "Contraseña de aplicación"
4. Usa estas credenciales en n8n:
   ```
   Host: smtp.gmail.com
   Port: 587
   User: comercial@avantahotel.com.mx
   Password: [app password de 16 caracteres]
   ```

### Opción 2: Office 365

```
Host: smtp.office365.com
Port: 587
User: comercial@avantahotel.com.mx
Password: [tu contraseña]
```

### Opción 3: Servidor SMTP propio

Contacta a tu proveedor de hosting para obtener:
- Host SMTP
- Puerto (usualmente 587 o 465)
- Usuario
- Contraseña

---

## 🔄 Flujo Completo Detallado

### 1. Usuario completa el formulario

Datos enviados:
```json
{
  "timestamp": "2025-01-17T10:30:00.000Z",
  "cliente": {
    "nombre": "juan",
    "apellidos": "pérez",
    "nombreCompleto": "juan pérez",
    "email": "JUAN@EMPRESA.COM",
    "telefono": "+52 (55) 1234-5678",
    "empresa": "Empresa ABC"
  },
  "origen": "formulario_web",
  "estado": "pendiente"
}
```

### 2. n8n normaliza los datos

Salida normalizada:
```json
{
  "timestamp": "2025-01-17T10:30:00.000Z",
  "cliente": {
    "nombre": "Juan",
    "apellidos": "Pérez",
    "nombreCompleto": "Juan Pérez",
    "email": "juan@empresa.com",
    "emailValido": true,
    "telefono": "+5255123456678",
    "empresa": "Empresa ABC",
    "empresaNormalizada": "EMPRESA ABC"
  },
  "convenio": {
    "numeroConvenio": "CNV-1705488600000",
    "fecha": "17/01/2025",
    "fechaISO": "2025-01-17",
    "estado": "generado"
  },
  "validacion": {
    "datosCompletos": true,
    "emailValido": true,
    "timestamp": "2025-01-17T10:30:00.000Z"
  }
}
```

### 3. n8n valida los datos

Verifica:
- ✅ Todos los campos están presentes
- ✅ Email tiene formato válido
- ✅ No hay campos vacíos

### 4. API genera el PDF

Recibe los datos y crea un PDF profesional con:
- Logo de Avanta
- Número de convenio único
- Datos de la empresa
- Beneficios corporativos
- Términos y condiciones
- Espacios para firmas

Devuelve:
```json
{
  "success": true,
  "numeroConvenio": "CNV-1705488600000",
  "fileName": "Convenio_CNV-1705488600000_EMPRESA_ABC.pdf",
  "pdfUrl": "https://api.avanta.com/convenios/Convenio_CNV-1705488600000_EMPRESA_ABC.pdf"
}
```

### 5. n8n envía emails

**Email 1 - Al cliente:**
- Asunto: "Convenio Empresarial - Empresa ABC"
- Contenido: Email HTML profesional con logo
- Adjunto: PDF del convenio
- Destinatario: juan@empresa.com

**Email 2 - Al equipo comercial:**
- Asunto: "Nueva Solicitud de Convenio - Empresa ABC"
- Contenido: Notificación con todos los datos
- Destinatario: comercial@avantahotel.com.mx

### 6. n8n responde al formulario

```json
{
  "success": true,
  "message": "Convenio generado y enviado exitosamente",
  "numeroConvenio": "CNV-1705488600000"
}
```

---

## 🧪 Pruebas

### Paso 1: Probar el webhook manualmente

Usa Postman o curl:

```bash
curl -X POST https://tu-n8n.app.n8n.cloud/webhook/convenio-avanta \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-01-17T10:30:00.000Z",
    "cliente": {
      "nombre": "Juan",
      "apellidos": "Pérez",
      "nombreCompleto": "Juan Pérez",
      "email": "juan@test.com",
      "telefono": "+5255123456678",
      "empresa": "Empresa Test"
    },
    "origen": "formulario_web",
    "estado": "pendiente"
  }'
```

### Paso 2: Verificar la normalización

En n8n, revisa la salida del nodo "Normalizar y Validar Datos". Debe mostrar:
- Nombres capitalizados correctamente
- Email en minúsculas
- Número de convenio generado
- Validación exitosa

### Paso 3: Verificar la generación del PDF

Comprueba que el PDF se genera correctamente y contiene:
- ✅ Logo de Avanta
- ✅ Datos del cliente
- ✅ Número de convenio único
- ✅ Beneficios listados
- ✅ Espacios para firmas

### Paso 4: Verificar emails

Revisa que lleguen ambos emails:
- ✅ Email al cliente con PDF adjunto
- ✅ Email al equipo comercial con notificación

### Paso 5: Probar el formulario web

1. Abre `index_n8n.html` en un navegador
2. Completa todos los campos
3. Envía el formulario
4. Verifica que aparezca el mensaje de éxito
5. Revisa que lleguen los emails

---

## 🔧 Troubleshooting

### Problema: El webhook no recibe los datos

**Solución:**
1. Verifica que el workflow esté **Activo** en n8n
2. Comprueba que la URL en el HTML sea correcta
3. Revisa la consola del navegador para errores de CORS
4. Si usas n8n self-hosted, verifica que el firewall permita conexiones

### Problema: Error de validación de datos

**Solución:**
1. Revisa el nodo "Normalizar y Validar Datos" en n8n
2. Verifica que todos los campos requeridos se estén enviando
3. Comprueba el formato del JSON en la consola del navegador

### Problema: No se genera el PDF

**Solución:**
1. Verifica que la API esté corriendo: `curl http://localhost:3000/generar-convenio`
2. Revisa los logs de la API
3. Comprueba que las dependencias estén instaladas: `npm list pdfkit`
4. Verifica que el directorio `convenios/` exista y tenga permisos de escritura

### Problema: Los emails no se envían

**Solución:**
1. Verifica las credenciales SMTP en n8n
2. Si usas Gmail, asegúrate de usar una "Contraseña de aplicación"
3. Revisa los logs de n8n para mensajes de error
4. Prueba las credenciales con un cliente SMTP como Thunderbird

### Problema: "Error de CORS" en el navegador

**Solución:**
Añade estas cabeceras en tu servidor web o en n8n:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

En nginx:
```nginx
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS';
add_header 'Access-Control-Allow-Headers' 'Content-Type';
```

### Problema: El PDF no se adjunta al email

**Solución:**
1. Verifica que la API devuelva el campo `pdfUrl`
2. Comprueba que la URL del PDF sea accesible públicamente
3. En el nodo de email de n8n, verifica que el campo "Attachments" tenga: `={{ $json.pdfUrl }}`

---

## 📊 Monitoreo y Mantenimiento

### Logs importantes a revisar:

1. **n8n Workflow Executions**: 
   - Ve a tu workflow > pestaña "Executions"
   - Revisa ejecuciones exitosas y fallidas

2. **API Logs**:
   ```bash
   pm2 logs convenios-api
   ```

3. **Email delivery**: 
   - Revisa la bandeja de spam
   - Verifica el bounce rate en tu proveedor SMTP

### Métricas a monitorear:

- Número de solicitudes recibidas
- Tasa de éxito de generación de PDFs
- Tasa de entrega de emails
- Tiempo promedio de procesamiento

---

## 🎉 ¡Listo!

Tu sistema de convenios automatizado está configurado y funcionando. El flujo completo es:

```
Usuario → Formulario → n8n → Validación → API PDF → Email → ✅ Éxito
```

### Próximos pasos opcionales:

1. **Integrar con CRM**: Conecta n8n con tu CRM para guardar los convenios
2. **Añadir firma electrónica**: Integra DocuSign o Adobe Sign
3. **Dashboard de seguimiento**: Crea un dashboard para ver el estado de los convenios
4. **Recordatorios automáticos**: Programa emails de seguimiento si no hay respuesta

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de n8n
2. Revisa los logs de la API
3. Verifica las credenciales SMTP
4. Consulta la documentación de n8n: https://docs.n8n.io

---

**Creado para Avanta Hotel & Villas**  
Versión 1.0 - Enero 2025
