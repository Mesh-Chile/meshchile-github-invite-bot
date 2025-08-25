# 🪝 Webhooks - MeshChile GitHub Bot

Documentación completa del sistema de webhooks para la promoción automática de usuarios basada en contribuciones.

## 🎯 Visión General

El sistema de webhooks detecta automáticamente cuando los miembros del equipo "Comunidad" realizan contribuciones significativas y los promociona al equipo "Colaboradores".

## 📡 Configuración del Webhook

### 1. Configuración en GitHub

**URL del Webhook:** `https://tu-dominio.com/webhook/github`

**Configuración requerida:**
```yaml
Payload URL: https://invite.meshchile.cl/webhook/github
Content type: application/json
Secret: tu_webhook_secret_123
SSL verification: Enable SSL verification (recomendado)
```

**Eventos a suscribir:**
- ✅ **Repositories** - Creación de repositorios
- ✅ **Pushes** - Commits a repositorios
- ✅ **Pull requests** - Apertura de PRs
- ✅ **Issues** - Creación de issues

### 2. Variables de Entorno

```bash
# Requerido para verificación de seguridad
GITHUB_WEBHOOK_SECRET=tu_webhook_secret_super_secreto

# Equipos para promoción
COMMUNITY_TEAM=comunidad
COLLABORATORS_TEAM=colaboradores

# Repositorio para mensajes de felicitación
WELCOME_REPO=bienvenidos
```

## 🔄 Eventos y Promociones

### Repository Created Event

**Trigger:** Usuario crea un repositorio en la organización

**Payload de ejemplo:**
```json
{
  "action": "created",
  "repository": {
    "name": "awesome-project",
    "full_name": "Mesh-Chile/awesome-project",
    "owner": {
      "login": "Mesh-Chile"
    },
    "created_at": "2025-08-24T10:30:00Z"
  },
  "sender": {
    "login": "developer123",
    "id": 12345
  }
}
```

**Criterios de promoción:**
- ✅ El repositorio pertenece a la organización (`Mesh-Chile`)
- ✅ El usuario (`sender.login`) es miembro del equipo "Comunidad"
- ✅ El usuario NO es ya miembro del equipo "Colaboradores"

**Acción:** Promoción automática con razón "Creó repositorio"

---

### Push Event

**Trigger:** Usuario hace push con commits a un repositorio

**Payload de ejemplo:**
```json
{
  "ref": "refs/heads/main",
  "commits": [
    {
      "id": "abc123def456",
      "message": "feat: add awesome feature",
      "author": {
        "name": "developer123",
        "email": "dev@example.com"
      },
      "added": ["src/feature.js"],
      "modified": ["README.md"]
    }
  ],
  "repository": {
    "name": "project",
    "owner": {
      "login": "Mesh-Chile"
    }
  },
  "pusher": {
    "name": "developer123"
  },
  "sender": {
    "login": "developer123"
  }
}
```

**Criterios de promoción:**
- ✅ Hay commits en el push (`commits.length > 0`)
- ✅ El repositorio pertenece a la organización
- ✅ El usuario pusher es miembro del equipo "Comunidad"

**Acción:** Promoción automática con razón "Push con X commits"

---

### Pull Request Opened Event

**Trigger:** Usuario abre un Pull Request

**Payload de ejemplo:**
```json
{
  "action": "opened",
  "number": 42,
  "pull_request": {
    "id": 789012,
    "number": 42,
    "title": "Fix critical bug in user authentication",
    "user": {
      "login": "developer123",
      "id": 12345
    },
    "head": {
      "ref": "fix/auth-bug",
      "sha": "def456abc123"
    },
    "base": {
      "ref": "main"
    }
  },
  "repository": {
    "owner": {
      "login": "Mesh-Chile"
    }
  }
}
```

**Criterios de promoción:**
- ✅ Acción es "opened"
- ✅ El repositorio pertenece a la organización
- ✅ El usuario (`pull_request.user.login`) es miembro "Comunidad"

**Acción:** Promoción automática con razón "Abrió Pull Request"

---

### Issues Opened Event

**Trigger:** Usuario crea un issue

**Payload de ejemplo:**
```json
{
  "action": "opened",
  "issue": {
    "id": 345678,
    "number": 15,
    "title": "Bug: Application crashes on startup",
    "body": "## Description\nThe app crashes when...",
    "user": {
      "login": "developer123",
      "id": 12345
    },
    "labels": [
      {
        "name": "bug",
        "color": "d73a4a"
      }
    ]
  },
  "repository": {
    "owner": {
      "login": "Mesh-Chile"
    }
  }
}
```

**Criterios de promoción:**
- ✅ Acción es "opened"  
- ✅ El repositorio pertenece a la organización
- ✅ El usuario (`issue.user.login`) es miembro "Comunidad"

**Acción:** Promoción automática con razón "Creó Issue"

## 🔐 Seguridad del Webhook

### Verificación de Firma

**Algoritmo:** HMAC SHA-256

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return signature === expectedSignature;
}
```

**Headers requeridos:**
```http
X-Hub-Signature-256: sha256=abc123def456...
X-GitHub-Event: push
X-GitHub-Delivery: 12345678-1234-1234-1234-123456789012
```

### Validación de Payload

**Verificaciones realizadas:**
1. ✅ Firma HMAC válida
2. ✅ Evento es uno de los monitoreados
3. ✅ Payload JSON bien formado
4. ✅ Repositorio pertenece a la organización
5. ✅ Usuario existe y es miembro

## ⚡ Flujo de Promoción

### 1. Recepción del Webhook

```javascript
app.post('/webhook/github', async (req, res) => {
  const event = req.headers['x-github-event'];
  const delivery = req.headers['x-github-delivery'];
  const signature = req.headers['x-hub-signature-256'];
  
  console.log(`📡 Webhook recibido: ${event} | Delivery: ${delivery}`);
  
  // Verificar signature si está configurado
  if (process.env.GITHUB_WEBHOOK_SECRET) {
    if (!verifySignature(req.body, signature, process.env.GITHUB_WEBHOOK_SECRET)) {
      return res.status(401).send('Unauthorized');
    }
  }
  
  const payload = JSON.parse(req.body.toString());
  await handlePromotionEvent(event, payload);
  
  res.status(200).send('OK');
});
```

### 2. Evaluación de Criterios

```javascript
async function handlePromotionEvent(event, payload) {
  let username = null;
  let shouldPromote = false;
  let reason = '';

  switch (event) {
    case 'repository':
      if (payload.action === 'created' && 
          payload.repository.owner.login === GITHUB_ORG) {
        username = payload.sender.login;
        shouldPromote = true;
        reason = 'Creó repositorio';
      }
      break;
      
    case 'push':
      if (payload.commits && payload.commits.length > 0 && 
          payload.repository.owner.login === GITHUB_ORG) {
        username = payload.pusher.name || payload.sender.login;
        shouldPromote = true;
        reason = `Push con ${payload.commits.length} commits`;
      }
      break;
      
    // ... otros casos
  }
  
  if (shouldPromote && username) {
    console.log(`🚀 Evaluando promoción para ${username}: ${reason}`);
    await promoteUserToCollaborator(username, reason);
  }
}
```

### 3. Proceso de Promoción

```javascript
async function promoteUserToCollaborator(username, reason) {
  try {
    // 1. Verificar si ya es colaborador
    try {
      await octokit.rest.teams.getMembershipForUserInOrg({
        org: GITHUB_ORG,
        team_slug: COLLABORATORS_TEAM,
        username
      });
      console.log(`ℹ️  ${username} ya es colaborador`);
      return; // Ya es colaborador
    } catch (error) {
      if (error.status !== 404) throw error;
    }

    // 2. Verificar membresía en la organización
    await octokit.rest.orgs.getMembershipForUser({
      org: GITHUB_ORG,
      username
    });

    // 3. Promover a colaborador
    await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
      org: GITHUB_ORG,
      team_slug: COLLABORATORS_TEAM,
      username: username,
      role: 'member'
    });

    console.log(`✅ ${username} promovido a Colaborador (${reason})`);

    // 4. Enviar mensaje de felicitación
    await sendCongratulationsMessage(username, reason);

  } catch (error) {
    console.error(`❌ Error promoviendo a ${username}:`, error.message);
  }
}
```

### 4. Mensaje de Felicitación

```javascript
async function sendCongratulationsMessage(username, reason) {
  try {
    const welcomeRepo = process.env.WELCOME_REPO || 'bienvenidos';

    await octokit.rest.issues.create({
      owner: GITHUB_ORG,
      repo: welcomeRepo,
      title: `🎉 ¡Felicitaciones @${username}! Promovido a Colaborador`,
      body: `¡Hola @${username}!

🎉 **¡Felicitaciones!** Has sido promovido automáticamente al equipo **Colaboradores** de MeshChile.

**Razón de la promoción:** ${reason}

Como colaborador ahora tienes:

✅ Acceso de escritura a los repositorios en los que participas
✅ Posibilidad de revisar Pull Requests
✅ Capacidad de crear y gestionar Issues
✅ Reconocimiento como miembro activo de la comunidad

¡Gracias por ser parte activa de MeshChile! 🚀

---
_Este mensaje fue generado automáticamente por el sistema de promoción de equipos._`,
      labels: ['bienvenida', 'promocion', 'colaborador']
    });

    console.log(`📧 Mensaje de felicitación enviado a ${username}`);
  } catch (error) {
    console.log(`⚠️  No se pudo enviar mensaje de felicitación a ${username}: ${error.message}`);
  }
}
```

## 📊 Monitoreo de Webhooks

### Logs de Eventos

**Formato de logs:**
```
[2025-08-24T10:30:00.000Z] 📡 Webhook recibido: push | Delivery: 12345678-1234-1234-1234-123456789012
[2025-08-24T10:30:01.000Z] 🚀 Evaluando promoción para developer123: Push con 3 commits
[2025-08-24T10:30:02.000Z] ✅ developer123 promovido a Colaborador (Push con 3 commits)
[2025-08-24T10:30:03.000Z] 📧 Mensaje de felicitación enviado a developer123
```

### Métricas a Monitorear

**Webhook Health:**
- ✅ Delivery success rate
- ⏱️ Processing time promedio
- 🔄 Retry attempts
- ❌ Failed deliveries

**Promoción Stats:**
- 📈 Promociones por día/semana
- 👥 Usuarios promovidos
- 📊 Distribución por tipo de evento
- ⚡ Tiempo de promoción promedio

### Debugging de Webhooks

**Verificar delivery:**
```bash
# En GitHub: Settings > Webhooks > Recent Deliveries
# Verificar Response: 200 OK
# Request body válido
# Response time < 10s
```

**Logs del servidor:**
```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Con Docker
docker-compose logs -f

# Filtrar webhooks
grep "Webhook recibido" logs/app.log
```

## 🧪 Testing de Webhooks

### Scripts de Testing Manual

**Simular evento de repositorio:**
```bash
node scripts/test-repository.js developer123
```

**Simular push event:**
```bash
node scripts/test-push.js developer123 5
```

**Test completo:**
```bash
node scripts/test-all-events.js developer123
```

### Payload de Test Manual

```bash
curl -X POST http://localhost:3000/webhook/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: repository" \
  -H "X-GitHub-Delivery: test-12345" \
  -H "X-Hub-Signature-256: sha256=abc123..." \
  -d '{
    "action": "created",
    "repository": {
      "name": "test-repo",
      "owner": {"login": "Mesh-Chile"}
    },
    "sender": {"login": "testuser"}
  }'
```

## 🚨 Troubleshooting

### Webhook No Se Ejecuta

**Posibles causas:**
1. ❌ URL del webhook incorrecta
2. ❌ SSL certificate issues
3. ❌ Webhook secret incorrecto
4. ❌ GitHub no puede alcanzar el servidor
5. ❌ Eventos no configurados correctamente

**Diagnóstico:**
```bash
# Verificar logs del servidor
grep "Webhook recibido" logs/app.log

# Verificar estado del webhook en GitHub
# Settings > Webhooks > Recent Deliveries
```

### Promoción No Ocurre

**Posibles causas:**
1. ❌ Usuario ya es colaborador
2. ❌ Usuario no es miembro de la organización
3. ❌ Repositorio no pertenece a la organización
4. ❌ Token GitHub sin permisos

**Diagnóstico:**
```bash
# Verificar permisos del token
node scripts/diagnostico-bienvenidos.js

# Verificar membresía del usuario
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/orgs/Mesh-Chile/members/username"
```

### Error en Mensaje de Felicitación

**Posibles causas:**
1. ❌ Repositorio "bienvenidos" no existe
2. ❌ Token sin permisos para crear issues
3. ❌ Issues deshabilitados en el repositorio

**Solución:**
```bash
# Verificar repositorio existe
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/Mesh-Chile/bienvenidos"

# Verificar permisos
node scripts/diagnostico-bienvenidos.js
```

## 📚 Mejores Prácticas

### Configuración Segura

1. **Usar HTTPS**: Siempre para webhooks en producción
2. **Configurar Secret**: Para verificar autenticidad
3. **Validar Payload**: Verificar estructura y contenido
4. **Rate Limiting**: Proteger contra spam de webhooks
5. **Logging**: Mantener audit trail completo

### Performance

1. **Response rápido**: Responder 200 OK inmediatamente
2. **Processing asíncrono**: Procesar en background si es necesario
3. **Timeout handling**: Manejar timeouts de GitHub API
4. **Retry logic**: Para fallos temporales

### Monitoreo

1. **Health checks**: Endpoint de salud del webhook
2. **Alertas**: Para fallos de promoción
3. **Métricas**: Dashboards de actividad
4. **Audit logs**: Trazabilidad completa

---

**🪝 Webhooks configurados** ✅  
**🔐 Seguridad implementada** ✅  
**📊 Monitoreo activo** ✅  
**🚀 Promoción automática** ✅
