# Formulario de Convenios - Avanta Hotel & Villas

## 📁 Archivos en esta carpeta

- `index.html` - Formulario web para solicitudes de convenio
- `logo_avanta_principal.png` - Logo oficial de Avanta

## 🚀 Instalación

### Opción 1: Servidor Web Propio

```bash
# Sube ambos archivos a tu servidor web
# Por ejemplo, en un hosting con cPanel:
# 1. Accede a "Administrador de archivos"
# 2. Ve a public_html/
# 3. Crea una carpeta "convenios/"
# 4. Sube index.html y logo_avanta_principal.png
```

### Opción 2: GitHub Pages (Gratis)

```bash
# 1. Crea un nuevo repositorio en GitHub
# 2. Sube estos archivos
# 3. Ve a Settings → Pages
# 4. Selecciona la rama "main" y carpeta "/root"
# 5. Tu formulario estará en: https://tu-usuario.github.io/repo-name/formulario/index.html
```

### Opción 3: Netlify/Vercel (Gratis)

```bash
# Arrastra toda la carpeta "formulario" a:
# - Netlify Drop: https://app.netlify.com/drop
# - Vercel: https://vercel.com/new
```

## ⚙️ Configuración

### Paso 1: Editar la URL del Webhook

Abre `index.html` en un editor de texto y busca la línea 428:

```javascript
const N8N_WEBHOOK_URL = "https://TU_INSTANCIA_N8N.app.n8n.cloud/webhook/convenio-avanta";
```

Reemplázala con la URL de tu webhook de n8n.

### Paso 2: Subir al servidor

Sube los archivos modificados a tu servidor web.

### Paso 3: Probar

Accede a tu formulario en el navegador:
```
https://tu-dominio.com/convenios/index.html
```

## 🎨 Personalización

### Cambiar colores

En `index.html`, busca las variables CSS (líneas 30-37):

```css
:root {
  --green: #7FA44A;        /* Color principal */
  --green-dark: #5F7F34;   /* Color hover */
  --text: #1F2933;         /* Color de texto */
  /* ... */
}
```

### Modificar textos

Busca las secciones:
- Línea 450: Título del panel izquierdo
- Línea 470: Título del formulario
- Línea 471: Subtítulo

### Añadir campos

1. Copia un `<div class="form-group">` existente
2. Pégalo donde quieras el nuevo campo
3. Modifica el `name`, `label` y `placeholder`
4. Añade el campo al objeto `data` en el script (línea 560)

## 📱 Responsive

El formulario es completamente responsive y se adapta a:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Móvil (320px - 767px)

## 🔒 Seguridad

El formulario incluye:
- ✅ Validación HTML5 en todos los campos
- ✅ Sanitización básica de datos
- ✅ HTTPS recomendado para producción
- ✅ Checkbox de términos y condiciones

## 🐛 Solución de Problemas

### El formulario no envía

1. **Abre la consola del navegador** (F12 → Console)
2. **Busca errores en rojo**
3. **Verifica la URL del webhook** esté correcta
4. **Comprueba que n8n esté activo**

### Error de CORS

Si ves este error en la consola:
```
Access to fetch at '...' has been blocked by CORS policy
```

**Solución:** Configura CORS en tu servidor n8n o añade estas cabeceras en tu servidor web.

### El logo no se muestra

1. **Verifica que `logo_avanta_principal.png` esté en la misma carpeta**
2. **Comprueba que el nombre del archivo sea exacto** (respeta mayúsculas/minúsculas)
3. **Revisa la ruta en el HTML** (línea 464)

## 📊 Analítica (Opcional)

Para añadir Google Analytics:

```html
<!-- Antes de </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=TU-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'TU-ID');
</script>
```

## 📞 Contacto

Si tienes problemas con el formulario:

**Avanta Hotel & Villas**  
📧 comercial@avantahotel.com.mx  
👤 Ricardo Peña - Ejecutivo Comercial

---

[← Volver al README principal](../README.md)
