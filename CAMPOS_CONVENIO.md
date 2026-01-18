# Campos del Convenio - Avanta Hotel & Villas

## 📋 Campos que se llenan automáticamente

El convenio se genera con los datos del formulario. Aquí está la correspondencia:

### 1. **Fecha** (esquina superior derecha)
```
(Fecha)
```
**Se llena con:** La fecha actual cuando se genera el convenio
**Formato:** "17 de enero de 2026"

---

### 2. **Encabezado - Nombre del contacto**
```
Lic. (Nombre) (Apellidos)
```
**Se llena con:** 
- `cliente.nombre` - Nombre del formulario
- `cliente.apellidos` - Apellidos del formulario

**Ejemplo:** "Lic. Juan Pérez González"

---

### 3. **Nombre de la Empresa** (en el texto)
```
Es un placer para mí ponerme en contacto con usted para presentarle las tarifas 
especiales para su empresa (Empresa) por parte de Avanta Hotel & Villas
```
**Se llena con:** `cliente.empresa`

**Ejemplo:** "...para su empresa (Constructora ABC S.A. de C.V.) por parte de..."

---

### 4. **Firma del Cliente** (parte inferior derecha)
```
Nombre Apellidos
Empresa
```
**Se llena con:**
- `cliente.nombreCompleto` - Nombre completo
- `cliente.empresa` - Nombre de la empresa

**Ejemplo:**
```
Juan Pérez González
Constructora ABC S.A. de C.V.
```

---

## 📊 Estructura de Datos del Formulario → PDF

### Lo que envía el formulario:
```json
{
  "timestamp": "2025-01-17T10:30:00.000Z",
  "cliente": {
    "nombre": "Juan",
    "apellidos": "Pérez González",
    "nombreCompleto": "Juan Pérez González",
    "email": "juan.perez@empresa.com",
    "telefono": "+52 55 1234 5678",
    "empresa": "Constructora ABC S.A. de C.V."
  },
  "origen": "formulario_web"
}
```

### Lo que n8n normaliza y envía a la API:
```json
{
  "numeroConvenio": "CNV-1705488600000",
  "cliente": {
    "nombre": "Juan",
    "apellidos": "Pérez González",
    "nombreCompleto": "Juan Pérez González",
    "email": "juan.perez@empresa.com",
    "telefono": "+525512345678",
    "empresa": "Constructora ABC S.A. de C.V.",
    "empresaNormalizada": "CONSTRUCTORA ABC S.A. DE C.V."
  },
  "fecha": "2025-01-17"
}
```

### Cómo se ve en el PDF generado:
```
                                                          (17 de enero de 2025)

Lic. Juan Pérez González

Es un placer para mí ponerme en contacto con usted para presentarle las tarifas 
especiales para su empresa (Constructora ABC S.A. de C.V.) por parte de Avanta 
Hotel & Villas

[...resto del convenio...]

Ricardo Peña Covarrubias            Juan Pérez González
Avanta Hotel & Villas               Constructora ABC S.A. de C.V.
```

---

## 🔧 Campos Fijos (NO se modifican)

Estos valores están fijos en el convenio y NO cambian:

### Tarifas:
- **Habitación Estándar King sin desayuno:** $940.00 por noche
- **Habitación Doble Queen sin desayuno:** $1,120.00 por noche
- **Habitación Estándar King con desayuno:** $1,230.00 por noche
- **Habitación Doble Queen con desayuno:** $1,699.00 por noche

### Dirección:
```
Carretera Querétaro - San Luis Potosí 23800, 
Santa Rosa Jáuregui, Querétaro, CP 76220
```

### Servicios:
- Wi-Fi de alta velocidad
- Sala de reuniones y espacio de trabajo para hasta 12 personas
- Estacionamiento gratuito

### Vigencia:
```
Tarifa vigente al 31 de diciembre de 2026 a partir de ahí el presente 
convenio continuará (no tiene vencimiento) con las respectivas 
actualizaciones de tarifa y documento
```

### Firma de Avanta:
```
Ricardo Peña Covarrubias
Avanta Hotel & Villas
```

---

## 🎨 Si quieres modificar las tarifas o textos fijos

Edita el archivo `api-generar-convenio-v2.js`:

### Para cambiar tarifas:
Busca las líneas 72-83 (aproximadamente):
```javascript
// Lista de tarifas sin desayuno
doc.fontSize(10)
   .list([
     'Habitación Estándar King:     $940.00  por noche.',
     'Habitación Doble Queen:       $1,120.00 por noche.'
   ], { bulletRadius: 2 });
```

### Para cambiar la dirección:
Busca la línea 65 (aproximadamente):
```javascript
doc.fontSize(10)
   .text('Estamos ubicados en Carretera Querétaro - San Luis Potosí 23800...')
```

### Para cambiar servicios:
Busca las líneas 103-107 (aproximadamente):
```javascript
doc.list([
  'Wi-Fi de alta velocidad.',
  'Sala de reuniones y espacio de trabajo para hasta 12 personas.',
  'Estacionamiento gratuito'
], { bulletRadius: 2 });
```

---

## 📝 Resumen de Campos Dinámicos

| Campo en el PDF | Viene de | Ejemplo |
|----------------|----------|---------|
| **(Fecha)** | Fecha actual del sistema | (17 de enero de 2025) |
| **Lic. (Nombre) (Apellidos)** | `cliente.nombreCompleto` | Lic. Juan Pérez González |
| **para su empresa (Empresa)** | `cliente.empresa` | (Constructora ABC S.A. de C.V.) |
| **Nombre Apellidos** (firma) | `cliente.nombreCompleto` | Juan Pérez González |
| **Empresa** (firma) | `cliente.empresa` | Constructora ABC S.A. de C.V. |

---

## 🔒 Datos que NO se usan en el PDF (pero se guardan)

Estos datos del formulario NO aparecen en el PDF pero se almacenan en n8n y se envían por email:

- **Email:** `cliente.email` → Se usa para enviar el PDF
- **Teléfono:** `cliente.telefono` → Se guarda pero no aparece en el PDF
- **Número de convenio:** `numeroConvenio` → Se usa para nombrar el archivo

---

## 💡 Notas Importantes

1. **Formato de nombre:** El sistema automáticamente capitaliza los nombres (Juan, no JUAN ni juan)
2. **Email:** Se convierte a minúsculas automáticamente
3. **Teléfono:** Se limpia de caracteres especiales (guiones, paréntesis, espacios)
4. **Empresa:** Se mantiene tal cual la escriba el usuario
5. **Fecha:** Siempre se genera con la fecha actual del servidor

---

## 🎯 Ejemplo Completo

### Datos del formulario:
```
Nombre: juan
Apellidos: PÉREZ gonzález
Empresa: constructora ABC s.a. de c.v.
Email: JUAN.PEREZ@EMPRESA.COM
Teléfono: +52 (55) 1234-5678
```

### Datos normalizados por n8n:
```
Nombre: Juan
Apellidos: Pérez González
Nombre Completo: Juan Pérez González
Empresa: Constructora Abc S.a. De C.v.
Email: juan.perez@empresa.com
Teléfono: +525512345678
```

### Cómo aparecen en el PDF:
```
Lic. Juan Pérez González

...para su empresa (Constructora Abc S.a. De C.v.)...

Ricardo Peña Covarrubias            Juan Pérez González
Avanta Hotel & Villas               Constructora Abc S.a. De C.v.
```

---

¿Necesitas modificar algún campo o agregar información adicional al convenio? 
Solo indícamelo y actualizo el código. 📄
