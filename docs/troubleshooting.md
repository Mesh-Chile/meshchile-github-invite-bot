# 🚨 Troubleshooting - MeshChile GitHub Bot

Guía completa para diagnosticar y resolver problemas comunes del sistema de invitaciones y promoción automática.

## 🔍 Diagnóstico Rápido

### Script de Diagnóstico Automático

**Ejecutar diagnóstico completo:**
```bash
node scripts/diagnostico-bienvenidos.js
```

**Salida esperada:**
```
🔍 Diagnóstico del repositorio bienvenidos

✅ Repositorio existe: Mesh-Chile/bienvenidos
✅ Puede leer issues
✅ Es miembro de Mesh-Chile
✅ repo: Disponible
✅ write:org: Disponible
✅ Issue creado exitosamente: #123
```

### Estado del Sistema

**Verificar que el bot está funcionando:**
```bash
curl https://invite.meshchile.cl/api/bot/status
```

**Respuesta saludable:**
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

## 🚫 Problemas de Invitación

### Usuario No Recibe Invitación

**Síntomas:**
- Frontend muestra "✅ Invitación enviada exitosamente"
- Usuario nunca recibe email de GitHub
- No aparece invitación en GitHub

**Diagnóstico:**
```bash
# 1. Verificar que el usuario existe
curl https://api.github.com/users/username

# 2. Verificar logs del servidor
grep "INVITE_SUCCESS.*username" logs/app.log

# 3. Verificar en GitHub UI
# Ve a: https://github.com/orgs/Mesh-Chile/people
# Tab: "Pending invitations"
```

**Soluciones:**

**🔧 Token sin permisos:**
```bash
# Verificar scopes del token
node scripts/diagnostico-bienvenidos.js

# Si falta scope 'write:org':
# 1. Ve a GitHub Settings → Personal access tokens
# 2. Edita el token existente
# 3. Marca checkbox 'write:org'
# 4. Regenera token
# 5. Actualiza en .env
```

**📧 Email en spam:**
```bash
# Usuario debe revisar:
# 1. Carpeta de spam/junk
# 2. Configuración de notificaciones GitHub
# 3. Email primario en GitHub settings
```

**⏰ Delay en entrega:**
```bash
# GitHub puede tardar hasta 10 minutos
# Verificar en logs si se envió:
grep "Invitación enviada exitosamente" logs/app.log
```

### Error "Usuario ya es miembro"

**Síntomas:**
```json
{
  "success": false,
  "message": "El usuario ya es miembro de la organización"
}
```

**Diagnóstico:**
```bash
# Verificar membresía actual
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/orgs/Mesh-Chile/members/username"

# 200 = Es miembro público
# 404 = No es miembro O membresía privada
```

**Soluciones:**

**👤 Membresía privada:**
```bash
# El usuario YA es miembro pero con membresía privada
# Solución: Usuario debe hacer pública su membresía
# 1. Ir a: https://github.com/orgs/Mesh-Chile/people
# 2. Buscar su nombre
# 3. Cambiar "Private" → "Public"
```

**🔄 Invitación pendiente:**
```bash
# Usuario tiene invitación pendiente sin aceptar
# 1. Ve a GitHub → Notificaciones
# 2. Busca invitación de Mesh-Chile
# 3. Aceptar invitación
```

### Error "Usuario no encontrado"

**Síntomas:**
```json
{
  "success": false,
  "message": "Usuario no encontrado en GitHub"
}
```

**Causas y soluciones:**

**❌ Username incorrecto:**
```bash
# Verificar username exacto
https://github.com/username-correcto

# Casos comunes:
# - Mayúsculas/minúsculas
# - Guiones vs underscores
# - Caracteres especiales
```

**🚫 Cuenta suspendida:**
```bash
# Si GitHub retorna 404:
curl https://api.github.com/users/username

# Puede ser cuenta suspendida o eliminada
```

## ⚡ Problemas de Promoción Automática

### Usuario No Es Promovido Automáticamente

**Síntomas:**
- Usuario hace contribución (repo, push, PR, issue)
- No recibe promoción a Colaboradores
- No aparece issue en repositorio "bienvenidos"

**Diagnóstico paso a paso:**

**1. Verificar que el webhook se recibió:**
```bash
grep "Webhook recibido" logs/app.log | tail -5

# Debe mostrar:
# [timestamp] 📡 Webhook recibido: push | Delivery: 12345...
```

**2. Verificar evaluación de promoción:**
```bash
grep "Evaluando promoción" logs/app.log | tail -5

# Debe mostrar:
# [timestamp] 🚀 Evaluando promoción para username: Push con 3 commits
```

**3. Verificar promoción exitosa:**
```bash
grep "promovido a Colaborador" logs/app.log | tail -5

# Debe mostrar:
# [timestamp] ✅ username promovido a Colaborador (Push con 3 commits)
```

**Soluciones por problema:**

**🪝 Webhook no se recibe:**
```bash
# Verificar configuración del webhook en GitHub
# 1. Ve a: https://github.com/Mesh-Chile/settings/hooks
# 2. Click en el webhook
# 3. Ver "Recent Deliveries"
# 4. Verificar Response: debe ser 200

# Problemas comunes:
# - URL incorrecta
# - SSL certificate issues
# - Secret incorrecto
# - Eventos no configurados
```

**👥 Usuario no es miembro "Comunidad":**
```bash
# Verificar membresía en equipo
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/orgs/Mesh-Chile/teams/comunidad/members/username"

# Si retorna 404, agregar manualmente:
curl -X PUT \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/orgs/Mesh-Chile/teams/comunidad/memberships/username"
```

**🎯 Usuario ya es Colaborador:**
```bash
# Verificar si ya es colaborador
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/orgs/Mesh-Chile/teams/colaboradores/members/username"

# Si retorna 200, ya es colaborador
```

**🏢 Contribución fuera de la organización:**
```bash
# Verificar que el repositorio pertenece a Mesh-Chile
# Solo eventos en repos de la organización disparan promoción

# El payload debe tener:
# "repository": {"owner": {"login": "Mesh-Chile"}}
```

### Error al Crear Issue de Felicitación

**Síntomas:**
```
⚠️ No se pudo enviar mensaje de felicitación a username: Not Found
```

**Diagnóstico:**
```bash
# Verificar que el repositorio bienvenidos existe
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/Mesh-Chile/bienvenidos"

# Verificar permisos del token
node scripts/diagnostico-bienvenidos.js
```

**Soluciones:**

**📦 Repositorio no existe:**
```bash
# Crear repositorio bienvenidos
gh repo create Mesh-Chile/bienvenidos --public --description "Mensajes de bienvenida para nuevos colaboradores"

# O via GitHub UI:
# 1. Ve a: https://github.com/Mesh-Chile
# 2. New repository
# 3. Name: bienvenidos
# 4. Public
# 5. Enable Issues
```

**🔐 Token sin permisos repo:**
```bash
# Verificar scopes necesarios
node scripts/diagnostico-bienvenidos.js

# Si falta scope 'repo':
# 1. Editar token en GitHub
# 2. Marcar checkbox 'repo'
# 3. Regenerar token
# 4. Actualizar .env
```

**🚫 Issues deshabilitados:**
```bash
# Verificar que Issues están habilitados
# 1. Ve a: https://github.com/Mesh-Chile/bienvenidos
# 2. Settings → Features
# 3. ✅ Issues debe estar marcado
```

## 🤖 Problemas de reCAPTCHA

### reCAPTCHA No Funciona

**Síntomas:**
- Checkbox no aparece
- Error "reCAPTCHA verification failed"
- Score muy bajo constante

**Diagnóstico frontend:**
```javascript
// En browser console
console.log(window.grecaptcha);
// Debe existir el objeto

// Verificar site key
console.log(document.querySelector('[data-sitekey]'));
// Debe mostrar el site key correcto
```

**Soluciones:**

**🔑 Site Key incorrecto:**
```bash
# Verificar site key en .env
grep RECAPTCHA_SITE_KEY .env

# Verificar en frontend (public/index.html)
grep "data-sitekey" public/index.html

# Deben coincidir
```

**🌐 Dominio no registrado:**
```bash
# En reCAPTCHA Admin Console:
# 1. Ve a: https://www.google.com/recaptcha/admin
# 2. Click en tu site
# 3. Settings → Domains
# 4. Agregar: localhost, tu-dominio.com
```

**📊 Score threshold muy alto:**
```javascript
// En server.js línea ~95
const minScore = 0.5; // Bajar a 0.3 si hay muchos false positives

// Verificar scores en logs
grep "reCAPTCHA.*score" logs/app.log
```

### reCAPTCHA Error de Red

**Síntomas:**
```
Error verificando reCAPTCHA v3: ECONNREFUSED
```

**Soluciones:**
```bash
# Verificar conectividad
curl https://www.google.com/recaptcha/api/siteverify

# Verificar firewall
# Permitir outbound HTTPS (puerto 443) a google.com

# En Docker/containers:
# Verificar que container puede acceder a internet
docker exec container_name curl https://www.google.com
```

## 🔄 Problemas de Rate Limiting

### Rate Limit Alcanzado Constantemente

**Síntomas:**
```json
{
  "success": false,
  "message": "Demasiadas solicitudes. Intenta nuevamente en 15 minutos."
}
```

**Diagnóstico:**
```bash
# Ver rate limit hits en logs
grep "Rate limit alcanzado" logs/app.log | tail -10

# Verificar IPs problemáticas
grep "Rate limit alcanzado" logs/app.log | awk '{print $NF}' | sort | uniq -c | sort -nr
```

**Soluciones:**

**📊 Ajustar límites para desarrollo:**
```javascript
// En server.js - para desarrollo
const inviteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minuto en lugar de 15
  max: 10,                  // 10 en lugar de 3
  // ...
});
```

**🌐 IP compartida (oficina/universidad):**
```javascript
// Whitelist IPs confiables
const trustedIPs = ['192.168.1.100', '203.0.113.50'];

const inviteLimiter = rateLimit({
  // ...
  skip: (req) => trustedIPs.includes(req.ip)
});
```

**🔄 Proxy/Load Balancer:**
```javascript
// Configurar trust proxy
app.set('trust proxy', 1);

// Para múltiples proxies
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
```

## 🐳 Problemas de Docker

### Container No Inicia

**Síntomas:**
```bash
docker-compose up -d
# Container exits immediately
```

**Diagnóstico:**
```bash
# Ver logs del container
docker-compose logs meshchile-bot

# Ver estado
docker-compose ps

# Verificar imagen
docker images | grep meshchile
```

**Soluciones:**

**📝 Error en .env:**
```bash
# Verificar que .env existe y está bien formado
cat .env | grep -v "^#" | grep "="

# Verificar variables requeridas
grep -E "GITHUB_TOKEN|GITHUB_ORG" .env
```

**🔗 Error de dependencias:**
```bash
# Rebuild desde cero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**🗂️ Permisos de archivos:**
```bash
# Verificar permisos del directorio logs
mkdir -p logs
chmod 755 logs

# En algunos sistemas
sudo chown -R $(id -u):$(id -g) logs/
```

### Error "Cannot find module"

**Síntomas:**
```
Error: Cannot find module 'express'
```

**Soluciones:**
```bash
# Rebuild con instalación limpia
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# O build manual
docker build -t meshchile-bot docker/
docker run --env-file .env -p 3000:3000 meshchile-bot
```

## 🌐 Problemas de Red y Conectividad

### Error Conectando a GitHub API

**Síntomas:**
```
Error: getaddrinfo ENOTFOUND api.github.com
```

**Diagnóstico:**
```bash
# Verificar conectividad básica
ping api.github.com
curl https://api.github.com

# Verificar DNS
nslookup api.github.com

# Verificar desde container
docker exec container_name curl https://api.github.com
```

**Soluciones:**

**🛡️ Firewall/Proxy corporativo:**
```bash
# Configurar proxy si es necesario
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# En Docker
docker run --env HTTP_PROXY=$HTTP_PROXY --env HTTPS_PROXY=$HTTPS_PROXY ...
```

**📡 Rate limit de GitHub:**
```bash
# Verificar rate limit
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# Esperar si está agotado
# Implementar backoff exponencial
```

## 📊 Problemas de Performance

### Respuestas Lentas

**Síntomas:**
- Timeouts en frontend
- Respuestas > 10 segundos
- High CPU/Memory usage

**Diagnóstico:**
```bash
# Monitorear recursos
htop
free -h
iostat -x 1

# Con Docker
docker stats

# Logs de performance
grep "Procesado en.*ms" logs/app.log | tail -10
```

**Soluciones:**

**⚡ Optimizar GitHub API calls:**
```javascript
// Cachear requests repetitivos
const cache = new Map();

async function getCachedUser(username) {
  if (cache.has(username)) {
    return cache.get(username);
  }
  
  const user = await octokit.rest.users.getByUsername({ username });
  cache.set(username, user.data);
  return user.data;
}
```

**📊 Ajustar rate limiting:**
```javascript
// Rate limiting menos agresivo
const inviteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutos
  max: 5,                   // 5 requests
});
```

## 🔧 Scripts de Diagnóstico

### Script de Health Check Completo

```bash
#!/bin/bash
# health-check.sh

echo "🏥 HEALTH CHECK COMPLETO - $(date)"
echo "=================================="

# 1. Verificar aplicación responde
echo "🌐 Verificando conectividad..."
if curl -f http://localhost:3000/api/bot/status > /dev/null 2>&1; then
  echo "✅ Aplicación responde"
else
  echo "❌ Aplicación no responde"
  exit 1
fi

# 2. Verificar GitHub API
echo "🐙 Verificando GitHub API..."
if curl -H "Authorization: token $GITHUB_TOKEN" \
   https://api.github.com/rate_limit > /dev/null 2>&1; then
  echo "✅ GitHub API accesible"
else
  echo "❌ GitHub API no accesible"
fi

# 3. Verificar repositorio bienvenidos
echo "📦 Verificando repositorio bienvenidos..."
if curl -H "Authorization: token $GITHUB_TOKEN" \
   https://api.github.com/repos/Mesh-Chile/bienvenidos > /dev/null 2>&1; then
  echo "✅ Repositorio bienvenidos accesible"
else
  echo "❌ Repositorio bienvenidos no accesible"
fi

# 4. Verificar logs recientes
echo "📋 Verificando logs recientes..."
ERRORS=$(grep "ERROR\|❌" logs/app.log | tail -10 | wc -l)
if [ $ERRORS -lt 5 ]; then
  echo "✅ Pocos errores recientes ($ERRORS)"
else
  echo "⚠️  Muchos errores recientes ($ERRORS)"
fi

echo "=================================="
echo "✅ Health check completado"
```

### Script de Reset Completo

```bash
#!/bin/bash
# reset-system.sh - Para casos extremos

echo "🔄 RESET COMPLETO DEL SISTEMA"
echo "============================="

# Backup actual
echo "💾 Creando backup..."
tar -czf backup-emergency-$(date +%Y%m%d-%H%M%S).tar.gz .env logs/

# Parar aplicación
echo "⏹️  Parando aplicación..."
docker-compose down

# Limpiar containers e imágenes
echo "🧹 Limpiando Docker..."
docker system prune -f

# Rebuild completo
echo "🔨 Rebuild completo..."
docker-compose build --no-cache

# Restart
echo "🚀 Reiniciando..."
docker-compose up -d

# Verificar
echo "✅ Verificando..."
sleep 10
curl -f http://localhost:3000/api/bot/status || echo "❌ Falló verificación"

echo "============================="
echo "✅ Reset completado"
```

---

**🔍 Diagnóstico disponible** ✅  
**🚨 Problemas identificados** ✅  
**🛠️ Soluciones documentadas** ✅  
**📋 Scripts de ayuda** ✅
