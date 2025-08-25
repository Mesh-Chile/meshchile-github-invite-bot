# ⚙️ Guía de Configuración - MeshChile GitHub Bot

Configuración detallada de todas las variables, servicios y parámetros del sistema.

## 📋 Variables de Entorno

### 🔐 Configuración de GitHub

| Variable | Requerido | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `GITHUB_TOKEN` | ✅ | Personal Access Token con scopes `repo`, `write:org`, `admin:org_hook` | `ghp_xxxxxxxxxxxx` |
| `GITHUB_ORG` | ✅ | Nombre de la organización GitHub | `Mesh-Chile` |
| `GITHUB_WEBHOOK_SECRET` | ⚠️ | Secret para verificar webhooks (recomendado) | `mi_webhook_secreto_123` |

### 👥 Configuración de Equipos

| Variable | Requerido | Descripción | Valor por Defecto |
|----------|-----------|-------------|-------------------|
| `COMMUNITY_TEAM` | ❌ | Slug del equipo para nuevos miembros | `comunidad` |
| `COLLABORATORS_TEAM` | ❌ | Slug del equipo para colaboradores | `colaboradores` |
| `WELCOME_REPO` | ❌ | Repositorio para mensajes de bienvenida | `bienvenidos` |

### 🛡️ Configuración de Seguridad

| Variable | Requerido | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `RECAPTCHA_SITE_KEY` | ⚠️ | Site Key de reCAPTCHA v3 | `6LcXXXXXXXXXXX` |
| `RECAPTCHA_SECRET_KEY` | ⚠️ | Secret Key de reCAPTCHA v3 | `6LcYYYYYYYYYYY` |
| `ADMIN_KEY` | ⚠️ | Clave para operaciones administrativas | `admin_secreto_456` |

### 🌐 Configuración del Servidor

| Variable | Requerido | Descripción | Valor por Defecto |
|----------|-----------|-------------|-------------------|
| `PORT` | ❌ | Puerto del servidor | `3000` |
| `NODE_ENV` | ❌ | Entorno de ejecución | `development` |
| `FRONTEND_URL` | ❌ | URL del frontend para CORS | `https://gh-invite.meshchile.cl` |
| `TRUST_PROXY` | ❌ | Configuración de reverse proxy | Auto-detectado |

### 🔗 Configuración de Reverse Proxy

| Variable | Descripción | Ejemplos |
|----------|-------------|----------|
| `TRUST_PROXY` | Configuración de proxies confiables | Ver tabla de configuraciones |

#### Configuraciones de TRUST_PROXY

| Valor | Descripción | Cuándo Usar |
|-------|-------------|-------------|
| `1` | Confía en 1 nivel de proxy | Railway, Render, Heroku |
| `2` | Confía en 2 niveles de proxy | Múltiples load balancers |
| `true` | Confía en todos los proxies | ⚠️ Solo desarrollo |
| `false` | No confía en proxies | Servidor directo sin proxy |
| `loopback` | Solo IPs loopback | Desarrollo local |
| `linklocal,uniquelocal` | Redes privadas | Redes corporativas |
| `IP1,IP2,IP3` | IPs específicas | Cloudflare, proxies conocidos |

#### Ejemplos de Configuración por Plataforma

**Cloudflare:**
```bash
TRUST_PROXY=103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,104.16.0.0/13
```

**Railway/Render/Heroku:**
```bash
TRUST_PROXY=1
```

**Múltiples Load Balancers:**
```bash
TRUST_PROXY=2
```

**Desarrollo Local:**
```bash
TRUST_PROXY=loopback
```

**Proxy Corporativo:**
```bash
TRUST_PROXY=10.0.0.1,192.168.1.100
```

## 🔧 Configuración Detallada

### GitHub Token Scopes

El token debe tener exactamente estos permisos:

```json
{
  "repo": "Full control of private repositories",
  "write:org": "Write org and team membership, read and write org projects", 
  "admin:org_hook": "Admin org hooks"
}
```

**Verificación de scopes:**
```bash
node scripts/diagnostico-bienvenidos.js
```

### Rate Limiting

Configuración automática por entorno:

| Entorno | Invitaciones/IP | Tiempo | Requests Generales |
|---------|-----------------|--------|-------------------|
| `test` | 1000 | 1 segundo | 10000/minuto |
| `development` | 100 | 1 minuto | 1000/minuto |
| `production` | 3 | 15 minutos | 20/minuto |

**Personalizar rate limits:**
```javascript
// En server.js líneas 18-25
const inviteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 3, // máximo 3 requests
    // ...
});
```

### reCAPTCHA v3

**Configuración recomendada:**
- **Score mínimo**: 0.5 (ajustable en código)
- **Acción**: `github_invite`
- **Dominios**: localhost + dominio producción

**Configurar score mínimo:**
```javascript
// En server.js línea 95
const minScore = 0.5; // Cambiar según necesidades
```

## 🏗️ Configuración de Infraestructura

### GitHub Organization Setup

#### Equipos Requeridos

**Equipo "Comunidad":**
```yaml
Name: Comunidad
Slug: comunidad
Description: Equipo base para todos los miembros nuevos
Visibility: Visible
Permission: Read (por defecto)
```

**Equipo "Colaboradores":**
```yaml
Name: Colaboradores  
Slug: colaboradores
Description: Miembros activos con contribuciones
Visibility: Visible
Permission: Write (repositorios específicos)
```

#### Repositorio "bienvenidos"

```yaml
Name: bienvenidos
Visibility: Public (recomendado)
Features:
  Issues: ✅ Enabled
  Wiki: ❌ Disabled  
  Projects: ❌ Disabled
  Discussions: ✅ Optional
```

### Webhooks de GitHub

**Configuración del webhook organizacional:**

1. **URL**: `https://gh-invite.meshchile.cl/webhook/github`
2. **Content Type**: `application/json`
3. **Secret**: Valor de `GITHUB_WEBHOOK_SECRET`
4. **SSL Verification**: ✅ Enable SSL verification

**Eventos a suscribir:**
- ✅ Repositories
- ✅ Pushes  
- ✅ Pull requests
- ✅ Issues

**JSON de configuración:**
```json
{
  "url": "https://gh-invite.meshchile.cl/webhook/github",
  "content_type": "json",
  "secret": "tu_webhook_secret",
  "insecure_ssl": "0",
  "events": ["repository", "push", "pull_request", "issues"]
}
```

## 🌍 Configuración por Entorno

### Desarrollo Local

```bash
# .env para desarrollo
NODE_ENV=development
PORT=3000
GITHUB_ORG=Mesh-Chile
FRONTEND_URL=http://localhost:3000

# Rate limiting relajado
# reCAPTCHA opcional
# Logging verboso habilitado
```

**Comandos de desarrollo:**
```bash
npm run dev          # Servidor con nodemon
npm run test         # Tests completos  
npm run test:watch   # Tests en modo watch
```

### Staging/Testing

```bash
# .env para staging
NODE_ENV=production
PORT=3000
GITHUB_ORG=Mesh-Chile-Test  # Org de pruebas
FRONTEND_URL=https://staging.meshchile.cl

# Rate limiting intermedio
# reCAPTCHA habilitado
# Logging completo
```

### Producción

```bash
# .env para producción
NODE_ENV=production
PORT=3000
GITHUB_ORG=Mesh-Chile
FRONTEND_URL=https://invite.meshchile.cl

# Rate limiting estricto
# reCAPTCHA v3 obligatorio
# Webhook signature obligatorio
# Logging auditado
```

## 🔒 Configuración de Seguridad

### Headers de Seguridad

Automáticamente configurados:
```javascript
{
  "X-RateLimit-Limit": "3",
  "X-RateLimit-Remaining": "2", 
  "X-RateLimit-Reset": "1693843200"
}
```

### CORS Policy

```javascript
// Configuración automática por entorno
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : true,
  credentials: true
};
```

### Validación de Input

**Username validation:**
```regex
/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
```

**Webhook signature verification:**
```javascript
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
  .update(req.body)
  .digest('hex');
```

## 📊 Configuración de Logging

### Audit Logs

```javascript
function auditLog(action, username, ip, success, message = '') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${success ? '✅' : '❌'} ${action}: ${username} | IP: ${ip} | ${message}`);
}
```

**Eventos loggeados:**
- ✅ Invitaciones exitosas
- ❌ Errores de invitación  
- 🚀 Promociones automáticas
- ⚠️ Rate limits alcanzados
- 📡 Webhooks recibidos
- 🔐 Intentos de admin

### Configuración de Logs

```bash
# Crear directorio de logs
mkdir -p logs

# Permisos apropiados  
chmod 755 logs
```

## 🧪 Configuración de Testing

### Variables para Tests

```bash
# tests/setup.js configura automáticamente:
NODE_ENV=test
GITHUB_ORG=test-org
COMMUNITY_TEAM=test-comunidad
COLLABORATORS_TEAM=test-colaboradores
WELCOME_REPO=test-bienvenidos
```

### Configuración de Coverage

```json
{
  "jest": {
    "collectCoverageFrom": [
      "server.js",
      "!node_modules/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80, 
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## 🚀 Configuración de Deployment

### Variables Específicas por Plataforma

**Railway:**
```bash
RAILWAY_STATIC_URL=https://meshchile-bot.railway.app
RAILWAY_ENVIRONMENT=production
```

**Render:**
```bash
RENDER_EXTERNAL_URL=https://meshchile-bot.onrender.com
RENDER_SERVICE_TYPE=web
```

**Heroku:**
```bash
HEROKU_APP_NAME=meshchile-github-bot
HEROKU_DYNO_TYPE=web
```

### Health Checks

**Endpoint de salud:**
```bash
GET /api/bot/status
```

**Respuesta esperada:**
```json
{
  "status": "active",
  "uptime": 3600,
  "security": {
    "rateLimiting": "enabled",
    "recaptcha": "enabled" 
  }
}
```

## 🔄 Configuración de Backup

### Variables de Entorno para Backup

```bash
# Configuración de logs persistentes
LOG_RETENTION_DAYS=30
BACKUP_FREQUENCY=daily

# Para deployments con volúmenes
BACKUP_VOLUME_PATH=/app/logs
```

### Rotación de Logs

```bash
# Configurar logrotate (Linux)
/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 nodejs nodejs
}
```

## 📚 Siguientes Pasos

Después de completar la configuración:

1. **[Configurar Webhooks](./webhooks.md)** - Eventos de GitHub
2. **[Guía de Admin](./admin-guide.md)** - Gestión administrativa  
3. **[Deployment](./deployment.md)** - Despliegue en producción
4. **[Monitoring](./monitoring.md)** - Supervisión del sistema

---

**🔧 Configuración completada** ✅  
**📋 Variables verificadas** ✅  
**🛡️ Seguridad configurada** ✅
