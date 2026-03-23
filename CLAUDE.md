# CLAUDE.md — Formulario_Convenio

Formulario web para solicitudes de **convenio empresarial** de **Avanta Hotel & Villas**. Captura datos de contacto, genera un PDF del convenio vía API en Vercel, y lo envía por correo mediante un webhook de n8n.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + Vanilla JavaScript (ES6+, async/await) |
| Estilos | CSS3 puro (Grid, Flexbox, animaciones, variables CSS) |
| Iconos | Font Awesome 6.4.0 (CDN) |
| Tipografía | Kodchasan + Cormorant Garamond (Google Fonts) + Kodchasan-Medium.ttf (local) |
| Generación de PDF | API Vercel (`convenios-avanta-2026.vercel.app`) |
| Envío de correo | n8n webhook (`chatbotventas-n8n.h0w0dc.easypanel.host`) |
| Deploy | Estático — GitHub Pages / Netlify / Vercel (cualquiera) |

No hay framework, bundler, ni dependencias npm.

---

## Estructura del proyecto

```
Formulario_Convenio/
├── index.html                    # Aplicación completa (HTML + CSS + JS)
├── logo_avanta_principal.png     # Logo de Avanta Hotel & Villas
├── Kodchasan-Medium.ttf          # Tipografía local (backup del CDN)
└── README.md                     # Instrucciones de deploy y personalización
```

---

## Flujo de la aplicación

```
Usuario llena formulario (nombre, apellidos, empresa, email, teléfono)
    ↓
Submit → validación HTML5 nativa + checkbox de términos
    ↓
Botón deshabilitado, loading "Generando PDF..."
    ↓
POST → Vercel API → recibe { fileName, pdfBase64 }
    ↓
Si error en PDF: alerta al usuario, restaura botón
    ↓
Loading cambia a "Enviando correo..."
    ↓
POST → n8n Webhook → envía datos completos + PDF en base64
    ↓
Éxito: oculta formulario, muestra sección de confirmación
Error: alerta al usuario, restaura botón
```

---

## Campos del formulario

| Campo | Tipo | Validación |
|-------|------|-----------|
| Nombre | text | required |
| Apellidos | text | required |
| Empresa | text | required |
| Email | email | required, type=email |
| Teléfono | tel | required |
| Términos y condiciones | checkbox | required |

---

## Integraciones externas

### API de generación de PDF (Vercel)

```javascript
const VERCEL_API_URL = "https://convenios-avanta-2026.vercel.app/api/generar-convenio-pdf";
```

**Request (POST):**
```json
{
  "numeroConvenio": "AVA-{timestamp}",
  "cliente": {
    "nombre": "...",
    "apellidos": "...",
    "nombreCompleto": "...",
    "email": "...",
    "telefono": "...",
    "empresa": "..."
  },
  "fecha": "YYYY-MM-DD"
}
```

**Response:**
```json
{
  "fileName": "convenio-AVA-xxx.pdf",
  "pdfBase64": "JVBERi0x..."
}
```

### Webhook n8n (envío de correo)

```javascript
const N8N_WEBHOOK_URL = "https://chatbotventas-n8n.h0w0dc.easypanel.host/webhook/convenio-avanta";
```

**Request (POST):**
```json
{
  "timestamp": "ISO string",
  "numeroConvenio": "AVA-{timestamp}",
  "cliente": { /* datos completos */ },
  "pdf": {
    "fileName": "convenio-AVA-xxx.pdf",
    "base64": "JVBERi0x..."
  },
  "origen": "formulario_web",
  "estado": "pendiente"
}
```

n8n se encarga de enviar el correo al cliente y a `comercial@avantahotel.com.mx`.

---

## Variables CSS

```css
:root {
  --green: #7FA44A;       /* Color principal */
  --green-dark: #5F7F34;  /* Hover */
  --text: #1F2933;
  --muted: #9CA3AF;
  --bg: #F5F5F5;
  --card: #FFFFFF;
  --border: #E5E7EB;
}
```

---

## Layout responsive

| Viewport | Layout |
|----------|--------|
| Desktop (≥768px) | Dos columnas: aside 45% + main 55% |
| Móvil (<768px) | Una columna, aside arriba, main abajo |

---

## Personalización

Para adaptar a otro cliente, editar en `index.html`:

1. **URLs** — `N8N_WEBHOOK_URL` y `VERCEL_API_URL` (líneas ~517-519)
2. **Colores** — variables CSS en `:root`
3. **Logo** — reemplazar `logo_avanta_principal.png`
4. **Textos** — título, subtítulo, nombre de ejecutivo, correo de contacto
5. **Redes sociales** — links en el footer

---

## Información del proyecto

- **Cliente:** Avanta Hotel & Villas
- **Contacto comercial:** Ricardo Peña — `comercial@avantahotel.com.mx`
- **Número de convenio:** generado automáticamente como `AVA-{Date.now()}`

---

## Pendientes / notas

| Ítem | Prioridad |
|------|-----------|
| Verificar que el webhook de n8n en easypanel esté activo | Alta |
| Verificar que la API de Vercel `convenios-avanta-2026` esté desplegada y activa | Alta |
| Validar teléfono con formato México (+52 o 10 dígitos) | Media |
| Agregar campo de número de empleados o giro de empresa | Baja |
