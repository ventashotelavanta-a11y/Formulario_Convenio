# Sistema de Convenios Automatizado - Avanta Hotel & Villas

Sistema completo para gestionar solicitudes de convenios empresariales con generación automática de PDFs y envío por correo electrónico.

![Avanta Hotel & Villas]([[formulario/logo_avanta_principal.png](https://drive.google.com/file/d/1V5yB8NDfOvo2CgBYzIv7nBOspiB7Wwsx))

## 🎯 ¿Qué hace este sistema?

1. **Formulario web** donde las empresas solicitan convenios
2. **Validación automática** de datos con n8n
3. **Generación de PDF** del convenio personalizado
4. **Envío automático** por email al cliente y equipo comercial

## 📂 Estructura del Proyecto

```
Formulario_Convenio/
├── README.md                           # Este archivo
├── GUIA_COMPLETA.md                    # Documentación detallada
│
├── formulario/                         # Formulario web
│   ├── index.html                      # Formulario para convenios
│   └── logo_avanta_principal.png       # Logo de Avanta
│
├── n8n/                                # Workflow de automatización
│   └── workflow_convenio.json          # Importar en n8n
│
└── api/                                # API para generar PDFs
    ├── generar-convenio.js             # Código de la API
    └── package.json                    # Dependencias
```

## 🚀 Inicio Rápido

### 1. Formulario Web

```bash
# Sube los archivos de la carpeta 'formulario/' a tu servidor web
# Edita formulario/index.html línea 428:
const N8N_WEBHOOK_URL = "https://tu-n8n.app.n8n.cloud/webhook/convenio-avanta";
```

### 2. Workflow n8n

```bash
# En n8n:
1. Workflows → Import from File
2. Selecciona: n8n/workflow_convenio.json
3. Configura credenciales SMTP
4. Activa el workflow
5. Copia la URL del webhook al formulario
```

### 3. API de PDFs

```bash
cd api/
npm install
npm start

# O con PM2:
pm2 start generar-convenio.js --name convenios-api
```

## 🔄 Flujo del Sistema

```
Usuario completa formulario
         ↓
n8n recibe y valida datos
         ↓
API genera convenio PDF
         ↓
n8n envía emails automáticos
         ↓
✅ Confirmación al usuario
```

## 📧 Configuración de Email

El sistema envía 2 correos automáticamente:
- ✅ **Al cliente:** Con el convenio PDF adjunto
- ✅ **Al equipo comercial:** Notificación de nueva solicitud

**Configuración SMTP requerida en n8n:**
```
Host: smtp.gmail.com
Port: 587
Email: comercial@avantahotel.com.mx
Password: [App Password]
```

[Cómo obtener App Password de Gmail →](https://support.google.com/accounts/answer/185833)

## 🛠️ Requisitos

- Servidor web (para el formulario)
- Cuenta de n8n (cloud o self-hosted)
- Node.js 14+ (para la API de PDFs)
- Cuenta SMTP (Gmail, Office365, etc.)

## 📖 Documentación

- [📘 Guía Completa](GUIA_COMPLETA.md) - Instalación paso a paso detallada
- [🔧 Configuración de n8n](n8n/) - Detalles del workflow
- [📄 API de PDFs](api/) - Personalización de convenios

## 🧪 Prueba Rápida

```bash
curl -X POST https://tu-webhook-n8n \
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

## ✨ Características

- ✅ Formulario web profesional y responsive
- ✅ Validación automática de datos
- ✅ Normalización de nombres, emails y teléfonos
- ✅ Generación de número único de convenio
- ✅ PDF personalizado con logo y datos
- ✅ Envío automático de emails HTML
- ✅ Notificación al equipo comercial
- ✅ Confirmación visual al usuario

## 🔧 Personalización

### Modificar el diseño del formulario
Edita `formulario/index.html`

### Cambiar el contenido del PDF
Edita `api/generar-convenio.js` (líneas 50-200)

### Modificar los emails
Edita los nodos de email en n8n

## 📞 Soporte

**Avanta Hotel & Villas**  
📧 comercial@avantahotel.com.mx  
👤 Ricardo Peña - Ejecutivo Comercial

## 📝 Notas

- El sistema genera un número único para cada convenio
- Los convenios tienen vigencia de 12 meses
- Se guardan en el directorio `api/convenios/`
- Los emails se envían automáticamente tras la validación

---

**Versión:** 1.0  
**Última actualización:** Enero 2025

## 🌟 Demo

**Formulario:** [Ver captura del formulario →](formulario/)

![Formulario de Convenios](https://via.placeholder.com/800x500?text=Captura+del+Formulario)

---

⭐ Si este proyecto te es útil, considera darle una estrella en GitHub
