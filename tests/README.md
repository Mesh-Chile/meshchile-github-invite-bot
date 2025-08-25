# Testing

Este directorio contiene todos los tests unitarios para la aplicación MeshChile GitHub Bot.

## Estructura de Tests

- `setup.js` - Configuración global y mocks para todos los tests
- `api.test.js` - Tests para todos los endpoints de la API REST
- `webhook.test.js` - Tests para el webhook de GitHub y sistema de promociones
- `edge-cases.test.js` - Tests para casos edge, validación de reCAPTCHA y manejo de errores
- `webhook-advanced.test.js` - Tests avanzados de webhook y casos de error
- `config-variations.test.js` - Tests para diferentes configuraciones del entorno

## Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (para desarrollo)
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## Configuración de Tests

Los tests usan:
- **Jest** como framework de testing
- **Supertest** para testing de endpoints HTTP
- **Mocks** para GitHub API y reCAPTCHA

### Variables de Entorno de Test

Los tests configuran automáticamente estas variables de entorno:

```
NODE_ENV=test
GITHUB_TOKEN=test-token
GITHUB_ORG=Test-Org
COMMUNITY_TEAM=test-comunidad
COLLABORATORS_TEAM=test-colaboradores
RECAPTCHA_SECRET_KEY=test-recaptcha-secret
RECAPTCHA_SITE_KEY=test-recaptcha-site
ADMIN_KEY=test-admin-key
GITHUB_WEBHOOK_SECRET=test-webhook-secret
WELCOME_REPO=test-bienvenidos
```

## Cobertura de Tests

**93.54% de cobertura total** con **62 tests** que cubren:

### API Endpoints
- ✅ `GET /api/config` - Configuración pública
- ✅ `GET /api/bot/status` - Estado del bot
- ✅ `GET /api/stats` - Estadísticas de la organización
- ✅ `GET /api/user/:username` - Preview de usuarios
- ✅ `POST /api/invite` - Solicitud de invitación
- ✅ `POST /api/admin/promote/:username` - Promoción manual
- ✅ `404 handler` - Rutas no encontradas

### Webhook System
- ✅ `POST /webhook/github` - Webhook de GitHub
- ✅ Eventos de repositorio (creación)
- ✅ Eventos de push
- ✅ Eventos de Pull Request
- ✅ Eventos de Issues
- ✅ Verificación de firma de webhook
- ✅ Promoción automática a colaboradores
- ✅ Mensajes de felicitación

### reCAPTCHA Validation
- ✅ Tokens faltantes o inválidos
- ✅ Scores bajos de reCAPTCHA
- ✅ Acciones incorrectas
- ✅ Errores de red y timeouts
- ✅ Configuración sin reCAPTCHA

### Edge Cases y Manejo de Errores
- ✅ Usuarios no encontrados
- ✅ Usuarios ya en la organización
- ✅ Formatos inválidos de username
- ✅ Firmas de webhook inválidas
- ✅ Claves de admin incorrectas
- ✅ Errores de API de GitHub
- ✅ JSON malformado
- ✅ Fallos en asignación de equipos
- ✅ Errors en promociones automáticas
- ✅ Mensajes de felicitación fallidos

### Webhook Security & Advanced Cases
- ✅ Manejo de JSON malformado en webhooks
- ✅ Headers faltantes o incorrectos
- ✅ Firmas de seguridad malformadas
- ✅ Eventos sin commits
- ✅ Diferentes acciones de eventos
- ✅ Errores en verificación de membresía

### Configuraciones del Entorno
- ✅ Detección de entorno (test/dev/prod)
- ✅ Configuración de reCAPTCHA
- ✅ Configuración de webhook secrets

## Mocks

### GitHub API (Octokit)
Todos los métodos de la API de GitHub están mockeados:
- `users.getByUsername()` 
- `orgs.get()`, `orgs.getMembershipForUser()`, `orgs.createInvitation()`
- `teams.addOrUpdateMembershipForUserInOrg()`, `teams.getMembershipForUserInOrg()`
- `issues.create()`

### reCAPTCHA (Axios)
Las llamadas a la API de reCAPTCHA están mockeadas para retornar respuestas exitosas.

## GitHub Actions

Los tests se ejecutan automáticamente en GitHub Actions:
- En múltiples versiones de Node.js (16.x, 18.x, 20.x)
- En push a ramas `main` y `develop`
- En Pull Requests
- Incluye audit de seguridad y build de Docker

Ver `.github/workflows/test.yml` para la configuración completa.