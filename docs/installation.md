# 🚀 Guía de Instalación - MeshChile GitHub Bot

Esta guía te llevará paso a paso por la instalación completa del sistema de invitaciones y promoción automática.

## 📋 Prerrequisitos

### Requisitos del Sistema
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git** para clonar el repositorio
- **Acceso de administrador** a la organización GitHub

### Cuentas y Servicios Requeridos
- **GitHub Organization** (Mesh-Chile)
- **reCAPTCHA v3** (Google)
- **Servidor/Hosting** (Railway, Render, VPS, etc.)

## 🛠️ Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Mesh-Chile/meshchile-github-invite-bot.git
cd meshchile-github-invite-bot
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

#### 3.1 Crear archivo .env
```bash
cp .env.example .env
nano .env
```

#### 3.2 Configurar variables básicas
```bash
# GitHub Configuration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_ORG=Mesh-Chile
GITHUB_WEBHOOK_SECRET=tu_webhook_secret_super_secreto

# Teams Configuration
COMMUNITY_TEAM=comunidad
COLLABORATORS_TEAM=colaboradores

# Welcome Repository
WELCOME_REPO=bienvenidos

# Server Configuration
PORT=3000
NODE_ENV=production
```

### 4. Configurar GitHub Token

#### 4.1 Crear Personal Access Token
1. Ve a GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Configura nombre: `MeshChile Bot Token`

#### 4.2 Seleccionar Scopes REQUERIDOS
✅ **OBLIGATORIOS:**
- `repo` - Full control of private repositories
- `write:org` - Write org and team membership
- `admin:org_hook` - Admin org hooks

#### 4.3 Verificar Permisos
```bash
node scripts/diagnostico-bienvenidos.js
```

**Salida esperada:**
```
✅ repo: Disponible
✅ write:org: Disponible
✅ Issue creado exitosamente: #123
```

### 5. Configurar reCAPTCHA

#### 5.1 Crear Sitio reCAPTCHA
1. Ve a https://www.google.com/recaptcha/admin/create
2. Selecciona **reCAPTCHA v3**
3. Agrega dominios:
   - `localhost` (desarrollo)
   - Tu dominio de producción

#### 5.2 Obtener Keys
```bash
# Agregar al .env
RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RECAPTCHA_SECRET_KEY=6LcYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

#### 5.3 Actualizar Frontend
Edita `public/index.html`:
```html
<script src="https://www.google.com/recaptcha/api.js?render=TU_SITE_KEY_AQUI"></script>
```

### 6. Configurar Equipos en GitHub

#### 6.1 Crear Equipo "Comunidad"
1. Ve a https://github.com/orgs/Mesh-Chile/teams
2. Click **"New team"**
3. Configurar:
   - **Name**: `Comunidad`
   - **Slug**: `comunidad` (automático)
   - **Description**: `Equipo base para todos los miembros nuevos`
   - **Visibility**: `Visible`

#### 6.2 Crear Equipo "Colaboradores"
1. Repetir proceso anterior
2. Configurar:
   - **Name**: `Colaboradores`
   - **Slug**: `colaboradores`
   - **Description**: `Miembros activos con contribuciones`
   - **Visibility**: `Visible`

### 7. Crear Repositorio de Bienvenida

#### 7.1 Crear Repo "bienvenidos"
```bash
# En GitHub UI o via CLI
gh repo create Mesh-Chile/bienvenidos --public --description "Mensajes de bienvenida para nuevos colaboradores"
```

#### 7.2 Configurar Issues
1. Ve al repositorio creado
2. Settings → Features
3. ✅ Issues habilitado
4. ❌ Wiki deshabilitado
5. ❌ Projects deshabilitado

### 8. Verificar Instalación

#### 8.1 Test Local
```bash
# Iniciar servidor
npm run dev

# En otra terminal
node scripts/diagnostico-bienvenidos.js
```

#### 8.2 Test de Funcionalidad
```bash
# Probar invitación
node scripts/test-repository.js testuser

# Verificar webhook
curl -X POST http://localhost:3000/api/bot/status
```

## 🔧 Instalación Automatizada

### Usando Script de Instalación
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

**El script automatiza:**
- Verificación de Node.js
- Instalación de dependencias
- Creación de .env template
- Verificaciones iniciales

## 🐳 Instalación con Docker

### Opción 1: Imagen Pre-construida
```bash
cd docker
cp ../env.example ../.env
# Editar .env con valores reales
docker-compose up -d
```

### Opción 2: Build Local
```bash
cd docker
docker-compose -f docker-compose.dev.yml up --build
```

## ☁️ Instalación en Cloud

### Railway (Recomendado)
```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

### Render
1. Conecta repositorio en render.com
2. Configura variables de entorno
3. Deploy automático

### Heroku
```bash
heroku create meshchile-github-bot
heroku config:set GITHUB_TOKEN=ghp_xxx
heroku config:set GITHUB_ORG=Mesh-Chile
git push heroku main
```

## 🔍 Verificación Post-Instalación

### Checklist de Verificación

#### ✅ Servicios Funcionando
- [ ] Servidor responde en puerto 3000
- [ ] GitHub API conectado correctamente
- [ ] reCAPTCHA configurado
- [ ] Equipos de GitHub creados
- [ ] Repositorio bienvenidos existe

#### ✅ Permisos y Accesos
- [ ] Token GitHub con scopes correctos
- [ ] Bot es admin de la organización
- [ ] Webhook secret configurado
- [ ] Logs de audit funcionando

#### ✅ Testing Funcional
```bash
# Test completo del sistema
node scripts/test-all-events.js testuser

# Verificar promoción
curl -H "Authorization: token $GITHUB_TOKEN" \
     "https://api.github.com/orgs/Mesh-Chile/teams/colaboradores/members"
```

## 🚨 Solución de Problemas Comunes

### Error: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Permission denied"
```bash
# Verificar token scopes
node scripts/diagnostico-bienvenidos.js
```

### Error: "EADDRINUSE"
```bash
# Puerto ocupado
killall node
# o cambiar PORT en .env
```

### Error: "reCAPTCHA verification failed"
```bash
# Verificar keys en .env y frontend
grep RECAPTCHA .env
grep TU_SITE_KEY public/index.html
```

## 📚 Siguientes Pasos

Después de completar la instalación:

1. **[Configuración Avanzada](./configuration.md)** - Ajustes adicionales
2. **[Configurar Webhook](./webhooks.md)** - Eventos de GitHub
3. **[Guía de Admin](./admin-guide.md)** - Gestión del sistema
4. **[Monitoreo](./monitoring.md)** - Supervisión en producción

## 📞 Soporte de Instalación

¿Problemas durante la instalación?

- **Issues**: [GitHub Issues](../../../issues)
- **Diagnóstico**: `node scripts/diagnostico-bienvenidos.js`
- **Logs**: `npm run docker:logs` o `tail -f logs/app.log`
- **Email**: info@meshchile.cl

---

**⏱️ Tiempo estimado**: 30-45 minutos  
**🎯 Dificultad**: Intermedio  
**📋 Estado**: Instalación completada ✅
