# Workflow n8n - Sistema de Convenios

## 📋 ¿Qué hace este workflow?

Este workflow de n8n automatiza todo el proceso de convenios:

1. ✅ Recibe datos del formulario web
2. ✅ Normaliza y valida la información
3. ✅ Genera el convenio en PDF
4. ✅ Envía emails automáticos
5. ✅ Notifica al equipo comercial

## 📦 Importar el Workflow

### Paso 1: Acceder a n8n

Ve a tu instancia de n8n:
- **n8n Cloud:** https://app.n8n.cloud
- **Self-hosted:** Tu URL personalizada

### Paso 2: Importar

1. Haz clic en **"+"** para crear un nuevo workflow
2. Haz clic en el menú **"⋮"** (esquina superior derecha)
3. Selecciona **"Import from File"**
4. Selecciona `workflow_convenio.json`
5. El workflow se cargará con todos los nodos

### Paso 3: Revisar los nodos

El workflow incluye estos nodos:

```
1. Webhook - Recibir Formulario
2. Normalizar y Validar Datos (Code)
3. Validar Datos (IF)
4. Generar Convenio PDF (HTTP Request)
5. Enviar Email con Convenio
6. Notificar a Equipo Comercial
7. Respuesta al Webhook
8. Respuesta Error
```

## ⚙️ Configuración

### 1. Configurar el Webhook

**Nodo:** "Webhook - Recibir Formulario"

1. Haz clic en el nodo
2. Copia la **"Production URL"**
3. Pégala en el formulario HTML (línea 428)

**Ejemplo de URL:**
```
https://tu-usuario.app.n8n.cloud/webhook/convenio-avanta
```

### 2. Configurar Credenciales SMTP

**Nodos:** "Enviar Email con Convenio" y "Notificar a Equipo Comercial"

#### Opción A: Gmail

1. Ve a **Credentials** en n8n
2. Click en **"+ New Credential"**
3. Selecciona **"SMTP"**
4. Configura:
   ```
   Name: SMTP - Avanta
   Host: smtp.gmail.com
   Port: 587
   Security: TLS
   User: comercial@avantahotel.com.mx
   Password: [App Password de 16 caracteres]
   ```

**Cómo obtener App Password:**
1. Ve a https://myaccount.google.com/security
2. Activa "Verificación en 2 pasos"
3. Busca "Contraseñas de aplicaciones"
4. Genera nueva → Selecciona "Correo" y "Otro"
5. Copia la contraseña de 16 caracteres (sin espacios)

#### Opción B: Office 365

```
Host: smtp.office365.com
Port: 587
User: comercial@avantahotel.com.mx
Password: [tu contraseña normal]
```

#### Opción C: Servidor SMTP propio

Contacta a tu proveedor de hosting para obtener:
- Host SMTP
- Puerto (normalmente 587 o 465)
- Usuario y contraseña

### 3. Configurar la API de PDF

**Nodo:** "Generar Convenio PDF"

1. Haz clic en el nodo
2. Busca el campo **"URL"**
3. Cambia:
   ```
   https://TU_API_CONVENIOS/generar-convenio
   ```
   Por tu URL real, ejemplo:
   ```
   https://api.avantahotel.com.mx/generar-convenio
   ```

### 4. Activar el Workflow

1. Haz clic en el **switch "Inactive/Active"** (esquina superior derecha)
2. El workflow ahora está escuchando

## 🧪 Probar el Workflow

### Prueba Manual

1. Haz clic en el nodo **"Webhook - Recibir Formulario"**
2. Click en **"Listen for Test Event"**
3. Envía una prueba desde el formulario o usa curl:

```bash
curl -X POST https://tu-webhook-url \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-01-17T10:30:00.000Z",
    "cliente": {
      "nombre": "Juan",
      "apellidos": "Pérez",
      "nombreCompleto": "Juan Pérez",
      "email": "test@empresa.com",
      "telefono": "+52 55 1234 5678",
      "empresa": "Empresa Test"
    },
    "origen": "formulario_web",
    "estado": "pendiente"
  }'
```

4. Verifica que cada nodo se ejecute correctamente
5. Revisa los datos que fluyen entre nodos

### Ver Ejecuciones

1. Ve a la pestaña **"Executions"** (parte superior)
2. Aquí verás todas las ejecuciones del workflow
3. Click en cualquiera para ver detalles
4. Las exitosas aparecen en **verde** ✅
5. Las fallidas aparecen en **rojo** ❌

## 📊 Estructura de Datos

### Entrada (del formulario):

```json
{
  "timestamp": "2025-01-17T10:30:00.000Z",
  "cliente": {
    "nombre": "juan",
    "apellidos": "pérez",
    "email": "JUAN@EMPRESA.COM",
    "telefono": "+52 (55) 1234-5678",
    "empresa": "Empresa ABC"
  },
  "origen": "formulario_web",
  "estado": "pendiente"
}
```

### Salida (normalizada):

```json
{
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
    "emailValido": true
  }
}
```

## 🔧 Personalización

### Modificar la validación

Edita el nodo **"Normalizar y Validar Datos"** para añadir:
- Validaciones adicionales
- Campos nuevos
- Transformaciones de datos

### Cambiar el contenido del email

Edita los nodos de email para modificar:
- Asunto
- Contenido HTML
- Destinatarios
- Adjuntos

### Añadir notificaciones

Puedes añadir nodos para notificar vía:
- **Slack** (n8n-nodes-base.slack)
- **WhatsApp** (via Twilio)
- **SMS** (via Twilio)
- **Discord** (n8n-nodes-base.discord)

## 🐛 Solución de Problemas

### El webhook no recibe datos

**Verificaciones:**
1. ✅ El workflow está **Activo**
2. ✅ La URL del webhook es correcta
3. ✅ El formulario está enviando a la URL correcta
4. ✅ No hay errores de CORS

**Solución CORS:**
En n8n, añade este nodo después del webhook:
- **Set** node con headers:
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: POST, OPTIONS
  ```

### Los emails no se envían

**Verificaciones:**
1. ✅ Credenciales SMTP correctas
2. ✅ Puerto correcto (587 para TLS)
3. ✅ Si es Gmail, usar App Password

**Prueba las credenciales:**
Crea un workflow simple solo con el nodo de email y envía un test.

### Error en la generación del PDF

**Verificaciones:**
1. ✅ La API está corriendo
2. ✅ La URL es accesible desde n8n
3. ✅ La API devuelve el campo `pdfUrl`

**Revisar respuesta:**
Haz clic en el nodo "Generar Convenio PDF" después de una ejecución para ver la respuesta de la API.

### Datos no se normalizan correctamente

**Verificación:**
Revisa el nodo "Normalizar y Validar Datos" y verifica:
- El código JavaScript
- Los datos de entrada
- La salida generada

## 📈 Monitoreo

### Revisar logs

1. Ve a **Executions** en n8n
2. Filtra por:
   - ✅ Exitosas
   - ❌ Fallidas
   - 📅 Fecha

### Alertas automáticas

Añade un nodo de email al final del workflow (branch de error) para recibir alertas cuando algo falla.

## 🔐 Seguridad

### Recomendaciones:

1. **Usa webhooks con autenticación** (Header Auth)
2. **No expongas credenciales** en el código
3. **Usa variables de entorno** para datos sensibles
4. **Implementa rate limiting** en tu servidor
5. **Valida todos los inputs** antes de procesarlos

### Añadir autenticación al webhook:

En el nodo Webhook, configura:
```
Authentication: Header Auth
Header Name: X-API-Key
Header Value: tu-clave-secreta-aqui
```

Luego actualiza el formulario para enviar esta cabecera.

## 📞 Soporte

Si tienes problemas con n8n:

- 📖 [Documentación oficial de n8n](https://docs.n8n.io)
- 💬 [Foro de la comunidad](https://community.n8n.io)
- 🐛 [GitHub Issues](https://github.com/n8n-io/n8n/issues)

Para soporte específico de Avanta:
- 📧 comercial@avantahotel.com.mx

---

[← Volver al README principal](../README.md)
