# 📤 Cómo Subir a GitHub

## Opción 1: Interfaz Web de GitHub (Más Fácil)

### Paso 1: Crear el repositorio

1. Ve a https://github.com
2. Inicia sesión
3. Click en el **"+"** (esquina superior derecha)
4. Selecciona **"New repository"**
5. Configura:
   - **Repository name:** `Formulario_Convenio` (o el nombre que prefieras)
   - **Description:** `Sistema de convenios automatizado para Avanta Hotel & Villas`
   - **Public** o **Private** (tú decides)
   - ✅ Marca "Add a README file"
6. Click en **"Create repository"**

### Paso 2: Subir los archivos

1. En tu repositorio, click en **"Add file"** → **"Upload files"**
2. Arrastra TODA la carpeta `github-repo` a la ventana
3. O click en **"choose your files"** y selecciona todo
4. Escribe un mensaje: `"Initial commit - Sistema de convenios"`
5. Click en **"Commit changes"**

### Paso 3: Verificar la estructura

Tu repositorio debería verse así:

```
Formulario_Convenio/
├── README.md
├── GUIA_COMPLETA.md
├── formulario/
│   ├── README.md
│   ├── index.html
│   └── logo_avanta_principal.png
├── n8n/
│   ├── README.md
│   └── workflow_convenio.json
└── api/
    ├── README.md
    ├── generar-convenio.js
    └── package.json
```

---

## Opción 2: Línea de Comandos (Git)

### Paso 1: Instalar Git

**Windows:** https://git-scm.com/download/win  
**Mac:** `brew install git` (o ya viene instalado)  
**Linux:** `sudo apt install git`

### Paso 2: Configurar Git (solo la primera vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Paso 3: Crear el repositorio en GitHub

1. Ve a https://github.com/new
2. Crea el repositorio (NO marques "Add a README file")
3. Copia la URL que aparece (ej: `https://github.com/usuario/Formulario_Convenio.git`)

### Paso 4: Subir los archivos

```bash
# Navega a la carpeta github-repo
cd /ruta/a/github-repo

# Inicializar git
git init

# Añadir todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit - Sistema de convenios"

# Conectar con GitHub (usa TU URL)
git remote add origin https://github.com/TU-USUARIO/Formulario_Convenio.git

# Subir los archivos
git branch -M main
git push -u origin main
```

### Paso 5: Ingresar credenciales

Si te pide credenciales:
- **Username:** Tu usuario de GitHub
- **Password:** Usa un **Personal Access Token** (no tu contraseña normal)

**Cómo crear un Personal Access Token:**
1. Ve a https://github.com/settings/tokens
2. Click en **"Generate new token (classic)"**
3. Dale un nombre: "Convenios Avanta"
4. Marca: `repo` (completo)
5. Click en **"Generate token"**
6. **COPIA EL TOKEN** (solo lo verás una vez)
7. Úsalo como password cuando git te lo pida

---

## Opción 3: GitHub Desktop (Interfaz Gráfica)

### Paso 1: Instalar GitHub Desktop

Descarga desde: https://desktop.github.com

### Paso 2: Iniciar sesión

1. Abre GitHub Desktop
2. File → Options → Accounts
3. Sign in to GitHub.com

### Paso 3: Crear repositorio

1. File → New Repository
2. Name: `Formulario_Convenio`
3. Local Path: Selecciona la carpeta `github-repo`
4. Click en **"Create Repository"**

### Paso 4: Publicar

1. Click en **"Publish repository"**
2. Desmarca "Keep this code private" (si quieres que sea público)
3. Click en **"Publish Repository"**

¡Listo! Tu código está en GitHub.

---

## 📋 Checklist Final

Antes de compartir tu repositorio, verifica:

- ✅ Todos los archivos están subidos
- ✅ La estructura de carpetas es correcta
- ✅ El README.md se ve bien en GitHub
- ✅ Los links internos funcionan
- ✅ El logo se muestra correctamente
- ✅ No has subido información sensible (claves, passwords)

## 🔒 Archivos a NO subir (ya están en .gitignore)

```
node_modules/
.env
convenios/*.pdf
*.log
.DS_Store
```

Si accidentalmente subes algo sensible:
1. Ve al archivo en GitHub
2. Click en el archivo → "History"
3. Click en los 3 puntos → "Delete file"
4. O usa: `git filter-branch` para eliminarlo del historial

---

## 🎉 Después de Subir

### Hacer tu repositorio más profesional:

1. **Añade temas/tags:**
   - Ve a tu repositorio
   - Click en el ⚙️ junto a "About"
   - Añade: `automation`, `n8n`, `pdf`, `nodejs`, `hotel-management`

2. **Añade una licencia:**
   - Add file → Create new file
   - Nombre: `LICENSE`
   - Click en "Choose a license template"
   - Selecciona "MIT License" (recomendada)

3. **Añade un .gitignore:**
   ```
   # Node
   node_modules/
   npm-debug.log
   
   # Environment
   .env
   .env.local
   
   # PDFs generados
   convenios/*.pdf
   
   # Sistema
   .DS_Store
   Thumbs.db
   ```

4. **Añade badges al README:**
   ```markdown
   ![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
   ![License](https://img.shields.io/badge/license-MIT-blue)
   ```

---

## 🔄 Actualizar el Repositorio

Cuando hagas cambios:

**Opción Web:**
1. Ve al archivo en GitHub
2. Click en el icono del lápiz ✏️
3. Haz los cambios
4. Click en "Commit changes"

**Opción Git:**
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

**Opción GitHub Desktop:**
1. Haz cambios en los archivos
2. Verás los cambios en GitHub Desktop
3. Escribe un mensaje de commit
4. Click en "Commit to main"
5. Click en "Push origin"

---

## 📞 Ayuda

Si tienes problemas:
- 📖 [Guía oficial de GitHub](https://docs.github.com/es)
- 💬 [GitHub Community](https://github.community/)
- 🎓 [GitHub Learning Lab](https://lab.github.com/)

---

**¡Tu código está listo para GitHub! 🚀**
