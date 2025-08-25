# Scripts de Testing Manual - MeshChile GitHub Bot

Este directorio contiene scripts para probar manualmente el sistema de promoción automática del bot mediante simulación de webhooks de GitHub.

## 📋 Scripts Disponibles

### 🔧 Utilidades Base
- **`webhook-utils.js`** - Librería de utilidades para generar payloads y firmas de webhook

### 🎯 Scripts de Testing Individual
- **`test-repository.js`** - Simula creación de repositorio
- **`test-push.js`** - Simula eventos de push con commits
- **`test-pull-request.js`** - Simula apertura de Pull Request
- **`test-issues.js`** - Simula creación de Issue

### 🚀 Script Completo
- **`test-all-events.js`** - Ejecuta todos los eventos en secuencia

### 🔍 Diagnóstico y Utilidades
- **`diagnostico-bienvenidos.js`** - Diagnostica permisos y configuración del token GitHub
- **`install.sh`** - Script de instalación rápida y configuración inicial

## 🏃‍♂️ Uso Rápido

### Configuración inicial:
```bash
# Script de instalación automática (Linux/macOS)
chmod +x scripts/install.sh
./scripts/install.sh

# Diagnóstico de permisos del token
node scripts/diagnostico-bienvenidos.js
```

### Probar un evento específico:
```bash
# Simular creación de repositorio
node scripts/test-repository.js octocat

# Simular push con 5 commits
node scripts/test-push.js octocat 5

# Simular Pull Request
node scripts/test-pull-request.js octocat "Fix critical bug"

# Simular Issue
node scripts/test-issues.js octocat "Feature request"
```

### Probar todos los eventos:
```bash
# Ejecutar todos los eventos con 2 segundos de delay
node scripts/test-all-events.js octocat

# Con delay personalizado (3 segundos)
node scripts/test-all-events.js octocat 3000
```

## 🔍 Script de Diagnóstico

### `diagnostico-bienvenidos.js`

**Propósito:** Verifica que el token de GitHub tenga los permisos correctos y puede crear issues en el repositorio "bienvenidos".

**Uso:**
```bash
node scripts/diagnostico-bienvenidos.js
```

**Qué verifica:**
- ✅ Acceso al repositorio "bienvenidos"
- ✅ Permisos para leer issues
- ✅ Tipo de autenticación (User/App)
- ✅ Membresía en la organización
- ✅ Scopes del token (repo, write:org, admin:org_hook)
- ✅ Creación de issue de prueba

**Salida esperada:**
```
✅ Repositorio existe: Mesh-Chile/bienvenidos
✅ Puede leer issues
✅ Es miembro de Mesh-Chile
✅ repo: Disponible
✅ write:org: Disponible
✅ Issue creado exitosamente: #123
```

**Si hay problemas:**
```
❌ repo: No disponible
❌ Error creando issue: Not Found
```

## 🛠️ Script de Instalación

### `install.sh`

**Propósito:** Automatiza la instalación inicial y configuración del proyecto.

**Uso:**
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

**Qué hace:**
- 🔍 Verifica que Node.js esté instalado
- 📦 Instala dependencias con `npm install`
- 📝 Crea archivo `.env` con template
- ⚙️ Configura estructura de directorios
- 🧪 Ejecuta verificaciones iniciales

**Requisitos:**
- Linux/macOS/WSL
- Node.js 16+ instalado
- Bash shell

**Para Windows:**
```bash
# Usar en WSL o Git Bash
wsl ./scripts/install.sh
```

## ⚙️ Configuración

### Variables de Entorno Requeridas
```bash
# Para que funcione la promoción automática
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_ORG=Mesh-Chile
COMMUNITY_TEAM=comunidad
COLLABORATORS_TEAM=colaboradores

# Opcional: Para verificación de firma de webhook
GITHUB_WEBHOOK_SECRET=tu_webhook_secret

# Opcional: Para mensajes de felicitación
WELCOME_REPO=bienvenidos
```

### Prerrequisitos
- Node.js 16+
- Servidor ejecutándose en `http://localhost:3000` (o configurar URL diferente)
- Token de GitHub con permisos de organización
- Usuario de prueba que sea miembro de la organización

## 📊 Eventos que Disparan Promoción

El sistema promociona automáticamente usuarios de "Comunidad" a "Colaboradores" cuando detecta estos eventos:

| Evento | Descripción | Script |
|--------|-------------|---------|
| `repository.created` | Usuario creó un repo en la org | `test-repository.js` |
| `push` | Usuario hizo push con commits | `test-push.js` |
| `pull_request.opened` | Usuario abrió un PR | `test-pull-request.js` |
| `issues.opened` | Usuario creó un issue | `test-issues.js` |

## 🔍 Verificación de Resultados

Después de ejecutar los scripts, verifica:

1. **Logs del servidor** - Debe mostrar mensajes de promoción
2. **Equipo "colaboradores"** - El usuario debe aparecer como miembro
3. **Repo "bienvenidos"** - Debe crearse un issue de felicitación
4. **GitHub API** - Verificar membresía con:
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/orgs/Mesh-Chile/teams/colaboradores/members"
   ```

## 🛠️ Personalización

### Cambiar URL del servidor:
```javascript
const webhookUtils = new WebhookUtils('http://localhost:8080');
```

### Agregar headers personalizados:
Edita `webhook-utils.js` en el método `sendWebhook()` para añadir headers adicionales.

### Payload personalizado:
Modifica los scripts individuales para cambiar los datos del payload según tus necesidades.

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"
- Verifica que el servidor esté ejecutándose en el puerto correcto
- Confirma la URL en los scripts

### Error: "Invalid signature"
- Verifica que `GITHUB_WEBHOOK_SECRET` coincida en servidor y scripts
- Si no usas webhook secret, será enviado sin firma (permitido en desarrollo)

### Error: "User not found"
- Asegúrate de que el usuario exista en GitHub
- Verifica que sea miembro de la organización

### No se produce la promoción:
- **Ejecutar diagnóstico primero:** `node scripts/diagnostico-bienvenidos.js`
- Confirma que el usuario esté en el equipo "comunidad"
- Verifica que no esté ya en el equipo "colaboradores"
- Revisa los logs del servidor para errores de API

### Token sin permisos:
```bash
# Usar el script de diagnóstico para identificar permisos faltantes
node scripts/diagnostico-bienvenidos.js

# Debería mostrar qué scopes faltan:
❌ repo: No disponible          # Recrear token con scope 'repo'
❌ write:org: No disponible     # Recrear token con scope 'write:org'
```

## 💡 Tips

1. **Modo desarrollo**: El servidor tiene rate limiting relajado en desarrollo
2. **Testing batch**: Usa `test-all-events.js` para probar múltiples escenarios rápidamente
3. **Delay entre eventos**: Ajusta el delay para evitar rate limiting
4. **Logs verbosos**: Ejecuta el servidor con `DEBUG=*` para más información
5. **Diagnóstico primero**: Siempre ejecuta `diagnostico-bienvenidos.js` antes de hacer testing

## 📚 Flujo de Trabajo Recomendado

```bash
# 1. Instalación inicial
./scripts/install.sh

# 2. Configurar .env con tokens correctos
nano .env

# 3. Verificar permisos
node scripts/diagnostico-bienvenidos.js

# 4. Si hay errores, arreglar token y volver al paso 3

# 5. Probar promoción
node scripts/test-repository.js tu-username

# 6. Verificar resultados en GitHub
```

## 📚 Ejemplos Avanzados

### Probar diferentes usuarios en lote:
```bash
#!/bin/bash
for user in "alice" "bob" "charlie"; do
    echo "Testing user: $user"
    node scripts/test-repository.js $user
    sleep 3
done
```

### Verificar promoción automática:
```bash
#!/bin/bash
USER="octocat"
echo "🚀 Testing promotion for $USER"

# Enviar evento
node scripts/test-push.js $USER

# Esperar procesamiento
sleep 2

# Verificar membresía
echo "Checking team membership..."
curl -s -H "Authorization: token $GITHUB_TOKEN" \
     "https://api.github.com/orgs/Mesh-Chile/teams/colaboradores/memberships/$USER" \
     | jq '.state'
```

### Debugging completo:
```bash
#!/bin/bash
echo "🔍 Diagnóstico completo del sistema"

# 1. Verificar permisos
echo "1. Verificando permisos del token..."
node scripts/diagnostico-bienvenidos.js

# 2. Probar webhook
echo "2. Probando webhook..."
node scripts/test-repository.js testuser

# 3. Verificar logs del servidor
echo "3. Últimos logs del servidor:"
tail -n 20 ../logs/app.log
```

---

🎯 **Objetivo**: Estos scripts te permiten probar manualmente todo el flujo de promoción automática sin necesidad de crear eventos reales en GitHub.

💡 **Recomendación**: Siempre ejecuta `diagnostico-bienvenidos.js` primero para asegurar que la configuración es correcta antes de hacer testing.
