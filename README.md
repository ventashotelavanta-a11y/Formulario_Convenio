# Sistema de Convenios Automatizado - Avanta Hotel & Villas

Sistema completo para gestionar solicitudes de convenios empresariales con generación automática de PDFs y envío por email.

## 🚀 Inicio Rápido

### 1. Configura el formulario HTML

```bash
# Sube a tu servidor web:
- index_n8n.html
- logo_avanta_principal.png

# Edita la URL del webhook en index_n8n.html línea 428
const N8N_WEBHOOK_URL = "https://tu-n8n.app.n8n.cloud/webhook/convenio-avanta";
```

### 2. Importa el workflow en n8n

```bash
# En n8n:
1. Workflows > Add workflow > Import from File
2. Selecciona: workflow_n8n_convenio.json
3. Configura credenciales SMTP
4. Activa el workflow
5. Copia la URL del webhook
```

### 3. Instala y ejecuta la API de PDFs

```bash
npm install
npm start

# O con PM2:
pm2 start api-generar-convenio.js --name convenios-api
```

### 4. Actualiza la URL de la API en n8n

En el nodo "Generar Convenio PDF", cambia:
```
https://TU_API_CONVENIOS/generar-convenio
```

## 📂 Archivos Incluidos

- `index_n8n.html` - Formulario web con el diseño final
- `workflow_n8n_convenio.json` - Workflow completo de n8n
- `api-generar-convenio.js` - API Node.js para generar PDFs
- `package.json` - Dependencias de la API
- `GUIA_COMPLETA_SISTEMA_CONVENIOS.md` - Documentación detallada

## 🔄 Flujo del Sistema

```
Usuario completa formulario
         ↓
n8n recibe y valida datos
         ↓
API genera convenio PDF
         ↓
n8n envía email al cliente + equipo
         ↓
Sistema confirma éxito
```

## ⚙️ Configuración Mínima Requerida

### En el HTML:
- URL del webhook de n8n

### En n8n:
- Credenciales SMTP (Gmail, Office365, etc.)
- URL de la API de PDFs

### En la API:
- Node.js instalado
- Puerto disponible (default: 3000)

## 📧 Configuración de Email (Gmail)

```javascript
Host: smtp.gmail.com
Port: 587
User: comercial@avantahotel.com.mx
Password: [App Password de 16 caracteres]
```

**Cómo obtener App Password:**
1. Ve a tu cuenta de Google
2. Seguridad > Verificación en 2 pasos (actívala)
3. Contraseñas de aplicaciones
4. Genera nueva > Selecciona "Correo" y "Otro"
5. Copia la contraseña de 16 caracteres

## 🧪 Prueba Rápida

```bash
curl -X POST https://tu-webhook-url \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": {
      "nombre": "Juan",
      "apellidos": "Pérez",
      "email": "test@empresa.com",
      "telefono": "+52 55 1234 5678",
      "empresa": "Empresa Test"
    }
  }'
```

## 🔧 Solución de Problemas

### El formulario no envía
- ✅ Verifica la URL del webhook en el HTML
- ✅ Asegúrate que el workflow esté Activo en n8n
- ✅ Revisa la consola del navegador (F12)

### No se genera el PDF
- ✅ Verifica que la API esté corriendo: `curl http://localhost:3000`
- ✅ Revisa los logs: `pm2 logs convenios-api`
- ✅ Comprueba que exista el directorio `convenios/`

### No llegan los emails
- ✅ Verifica las credenciales SMTP en n8n
- ✅ Si usas Gmail, usa una "Contraseña de aplicación"
- ✅ Revisa la carpeta de spam

## 📊 Datos que Genera el Sistema

Cada convenio incluye:
- ✅ Número único de convenio
- ✅ Datos de la empresa
- ✅ Contacto responsable
- ✅ Fecha de emisión
- ✅ Beneficios corporativos
- ✅ Términos y condiciones
- ✅ Vigencia (12 meses)
- ✅ Espacios para firmas

## 🎯 Personalización

### Cambiar el diseño del PDF
Edita `api-generar-convenio.js` líneas 50-200

### Cambiar el contenido del email
Edita el nodo "Enviar Email con Convenio" en n8n

### Añadir campos al formulario
1. Añade el campo en `index_n8n.html`
2. Actualiza el objeto `data` en el script
3. Modifica la normalización en n8n si es necesario

## 📞 Contacto

**Avanta Hotel & Villas**  
Email: comercial@avantahotel.com.mx  
Ejecutivo Comercial: Ricardo Peña

---

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Documentación completa:** Ver `GUIA_COMPLETA_SISTEMA_CONVENIOS.md`
