# 📡 API Reference - MeshChile GitHub Bot

Documentación completa de todos los endpoints y APIs del sistema de invitaciones y promoción automática.

## 🌐 Base URL

- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://gh-invite.meshchile.cl`
- **API**: `https://api.gh-invite.meshchile.cl` (si está separada)

## 🔐 Autenticación

### GitHub Token
Requerido para operaciones administrativas. Se configura via variable de entorno `GITHUB_TOKEN`.

### Admin Key
Requerido para endpoints administrativos. Se envía en el body como `adminKey`.

### reCAPTCHA Token
Requerido para endpoints públicos de invitación. Se obtiene del frontend con reCAPTCHA v3.

## 📋 Endpoints Públicos

### POST /api/invite
Solicita una invitación a la organización GitHub.

**Request:**
```http
POST /api/invite
Content-Type: application/json

{
  "username": "octocat",
  "recaptchaToken": "03AGdBq25..."
}
```

**Request Schema:**
```json
{
  "username": {
    "type": "string",
    "required": true,
    "pattern": "^[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}$",
    "description": "GitHub username válido"
  },
  "recaptchaToken": {
    "type": "string", 
    "required": true,
    "description": "Token de reCAPTCHA v3"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Invitación enviada exitosamente a octocat",
  "user": {
    "username": "octocat",
    "name": "The Octocat",
    "avatar": "https://github.com/octocat.png"
  },
  "teamAssigned": true
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Nombre de usuario requerido"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Usuario no encontrado en GitHub"
}
```

**Response Error (409):**
```json
{
  "success": false,
  "message": "El usuario ya es miembro de la organización"
}
```

**Response Error (429):**
```json
{
  "success": false,
  "message": "Demasiadas solicitudes. Intenta nuevamente en 15 minutos."
}
```

**Rate Limiting:**
- **Desarrollo**: 100 requests/minuto por IP
- **Producción**: 3 requests/15 minutos por IP

---

### GET /api/user/:username
Obtiene información básica de un usuario de GitHub para preview.

**Request:**
```http
GET /api/user/octocat
```

**Parameters:**
- `username` (path): GitHub username a consultar

**Response Success (200):**
```json
{
  "login": "octocat",
  "name": "The Octocat",
  "avatar_url": "https://github.com/octocat.png",
  "bio": "A great octopus masquerading as a cat",
  "location": "San Francisco",
  "public_repos": 8,
  "followers": 9001,
  "created_at": "2011-01-25T18:44:36Z"
}
```

**Response Error (404):**
```json
{
  "error": "Usuario no encontrado"
}
```

**Response Error (400):**
```json
{
  "error": "Formato de username inválido"
}
```

**Rate Limiting:**
- **Desarrollo**: 1000 requests/minuto por IP
- **Producción**: 10 requests/minuto por IP

---

### GET /api/bot/status
Obtiene el estado actual del bot y configuración pública.

**Request:**
```http
GET /api/bot/status
```

**Response (200):**
```json
{
  "status": "active",
  "organization": "Mesh-Chile",
  "teams": {
    "community": "comunidad",
    "collaborators": "colaboradores"
  },
  "security": {
    "rateLimiting": "enabled",
    "recaptcha": "enabled",
    "webhookSecret": "configured"
  },
  "features": [
    "Auto invitation to Community team",
    "Auto promotion to Collaborators team", 
    "Webhook event processing",
    "Rate limiting protection",
    "reCAPTCHA verification",
    "User preview functionality",
    "Audit logging"
  ],
  "uptime": 3600,
  "nodeVersion": "v18.17.0",
  "environment": "production"
}
```

---

### GET /api/stats
Obtiene estadísticas básicas de la organización.

**Request:**
```http
GET /api/stats
```

**Response (200):**
```json
{
  "organization": {
    "name": "MeshChile",
    "description": "Comunidad de entusiastas de Meshtastic en Chile",
    "public_repos": 42,
    "followers": 156,
    "created_at": "2023-01-15T10:30:00Z"
  },
  "bot": {
    "uptime": 7200,
    "status": "active"
  }
}
```

---

### GET /api/config
Obtiene configuración pública para el frontend.

**Request:**
```http
GET /api/config
```

**Response (200):**
```json
{
  "recaptchaSiteKey": "6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "githubOrg": "Mesh-Chile",
  "environment": "production"
}
```

## 🔒 Endpoints Administrativos

### POST /api/admin/promote/:username
Promociona manualmente un usuario al equipo de colaboradores.

**Request:**
```http
POST /api/admin/promote/octocat
Content-Type: application/json

{
  "adminKey": "tu_clave_super_secreta_123",
  "reason": "Contribución excepcional al proyecto X"
}
```

**Parameters:**
- `username` (path): GitHub username a promocionar

**Request Schema:**
```json
{
  "adminKey": {
    "type": "string",
    "required": true,
    "description": "Clave administrativa secreta"
  },
  "reason": {
    "type": "string",
    "required": false,
    "description": "Razón de la promoción manual"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Usuario octocat promovido manualmente a Colaborador"
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "No autorizado"
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Error promoviendo usuario: User not found"
}
```

## 🪝 Webhook Endpoints

### POST /webhook/github
Recibe y procesa webhooks de GitHub para promoción automática.

**Request Headers:**
```http
Content-Type: application/json
X-GitHub-Event: push
X-GitHub-Delivery: 12345678-1234-1234-1234-123456789012
X-Hub-Signature-256: sha256=abc123...
User-Agent: GitHub-Hookshot/abc123
```

**Request Body (Push Event):**
```json
{
  "action": "created",
  "repository": {
    "name": "awesome-project",
    "owner": {
      "login": "Mesh-Chile"
    }
  },
  "sender": {
    "login": "octocat"
  },
  "commits": [
    {
      "id": "abc123",
      "message": "feat: add awesome feature",
      "author": {
        "name": "octocat"
      }
    }
  ]
}
```

**Response Success (200):**
```http
OK
```

**Response Error (401):**
```http
Unauthorized
```

**Response Error (500):**
```http
Error
```

**Eventos Procesados:**
- `repository.created` - Usuario creó repositorio
- `push` - Usuario hizo push con commits
- `pull_request.opened` - Usuario abrió PR
- `issues.opened` - Usuario creó issue

## 📊 Rate Limiting

### Headers de Rate Limiting

Todos los endpoints incluyen headers informativos:

```http
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1693843200
Retry-After: 900
```

### Límites por Endpoint

| Endpoint | Desarrollo | Producción | Ventana |
|----------|------------|------------|---------|
| `/api/invite` | 100/min | 3/15min | Por IP |
| `/api/user/:username` | 1000/min | 10/min | Por IP |
| General | 1000/min | 20/min | Por IP |

### Configuración por Entorno

```javascript
// Configuración automática
const limits = {
  test: { max: 1000, window: 1000 },
  development: { max: 100, window: 60000 },
  production: { max: 3, window: 900000 }
};
```

## 🛡️ Códigos de Error

### Códigos HTTP Estándar

| Código | Descripción | Cuándo Ocurre |
|--------|-------------|---------------|
| `200` | OK | Request exitoso |
| `400` | Bad Request | Datos inválidos |
| `401` | Unauthorized | Clave admin inválida |
| `404` | Not Found | Usuario/ruta no encontrada |
| `409` | Conflict | Usuario ya es miembro |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Error del servidor |

### Códigos de Error Personalizados

```json
{
  "success": false,
  "error": {
    "code": "INVALID_USERNAME",
    "message": "Formato de nombre de usuario inválido",
    "details": "Username must match pattern: /^[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}$/"
  }
}
```

**Códigos Específicos:**
- `INVALID_USERNAME` - Formato de username incorrecto
- `USER_NOT_FOUND` - Usuario no existe en GitHub
- `ALREADY_MEMBER` - Usuario ya es miembro
- `RECAPTCHA_FAILED` - reCAPTCHA inválido
- `RATE_LIMIT_EXCEEDED` - Demasiadas requests
- `GITHUB_API_ERROR` - Error de la API de GitHub

## 📝 Ejemplos de Uso

### JavaScript/Fetch

```javascript
// Solicitar invitación
async function requestInvite(username, recaptchaToken) {
  const response = await fetch('/api/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      recaptchaToken
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Invitación enviada:', data.message);
  } else {
    console.error('Error:', data.message);
  }
}

// Preview de usuario
async function getUserPreview(username) {
  const response = await fetch(`/api/user/${username}`);
  
  if (response.ok) {
    const user = await response.json();
    console.log('Usuario:', user);
  } else {
    const error = await response.json();
    console.error('Error:', error.error);
  }
}
```

### cURL

```bash
# Solicitar invitación
curl -X POST http://localhost:3000/api/invite \
  -H "Content-Type: application/json" \
  -d '{
    "username": "octocat",
    "recaptchaToken": "03AGdBq25..."
  }'

# Preview de usuario  
curl http://localhost:3000/api/user/octocat

# Estado del bot
curl http://localhost:3000/api/bot/status

# Promoción manual (admin)
curl -X POST http://localhost:3000/api/admin/promote/octocat \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "tu_clave_secreta",
    "reason": "Contribución excepcional"
  }'
```

### Python/Requests

```python
import requests

# Solicitar invitación
def request_invite(username, recaptcha_token):
    url = "http://localhost:3000/api/invite"
    data = {
        "username": username,
        "recaptchaToken": recaptcha_token
    }
    
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Invitación enviada: {result['message']}")
    else:
        error = response.json()
        print(f"Error: {error['message']}")

# Preview de usuario
def get_user_preview(username):
    url = f"http://localhost:3000/api/user/{username}"
    response = requests.get(url)
    
    if response.status_code == 200:
        user = response.json()
        print(f"Usuario: {user['login']} - {user['name']}")
    else:
        error = response.json()
        print(f"Error: {error['error']}")
```

## 🔍 Testing de APIs

### Usando Scripts Incluidos

```bash
# Test completo del sistema
node scripts/test-all-events.js testuser

# Test individual de repositorio
node scripts/test-repository.js testuser

# Diagnóstico de permisos
node scripts/diagnostico-bienvenidos.js
```

### Postman Collection

```json
{
  "info": {
    "name": "MeshChile GitHub Bot API"
  },
  "item": [
    {
      "name": "Request Invitation",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/invite",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"{{username}}\",\n  \"recaptchaToken\": \"{{recaptcha}}\"\n}"
        }
      }
    }
  ]
}
```

---

**📡 API Version**: v1.0  
**🔧 Content-Type**: `application/json`  
**🛡️ Rate Limited**: ✅ All endpoints  
**📝 OpenAPI**: Spec disponible bajo request
