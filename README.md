# MeshChile GitHub Organization Bot

Sistema automatizado de invitaciones y promoción de usuarios para la organización GitHub de MeshChile.

## 🚀 Características

- **Invitaciones automáticas** con asignación al equipo "Comunidad"
- **Promoción automática** a "Colaboradores" basada en contribuciones
- **Rate limiting** para prevenir abuso
- **reCAPTCHA** para protección contra bots
- **Preview de usuario** en tiempo real
- **Audit logging** completo
- **Webhooks de GitHub** para detección de contribuciones

## 📦 Instalación

### 1. Clonar y configurar

```bash
git clone <tu-repositorio>
cd meshchile-github-bot
npm install
```

### 2. Configurar variables de entorno

Copiar el contenido del `.env` ejemplo y configurar:

```bash
touch .env
# Copiar contenido del ejemplo y configurar con valores reales
```

### 3. Configurar GitHub Token

**⚠️ IMPORTANTE: El token debe tener los scopes correctos o el bot NO funcionará**

#### 3.1 Crear Personal Access Token (PAT)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Configurar:
   - **Note:** `MeshChile Bot Token`
   - **Expiration:** `No expiration` (o según tu política de seguridad)

#### 3.2 Seleccionar Scopes REQUERIDOS

**✅ OBLIGATORIOS - Sin estos scopes el bot fallará:**

- **`repo`** - Full control of private repositories
  - ✅ Necesario para crear issues de felicitación
  - ✅ Necesario para leer información de repositorios
  - ✅ Necesario para detectar eventos de contribución

- **`write:org`** - Write org and team membership, read and write org projects
  - ✅ Necesario para agregar usuarios a equipos
  - ✅ Necesario para gestionar membresías de equipos
  - ✅ Incluye automáticamente `read:org`

- **`admin:org_hook`** - Admin org hooks
  - ✅ Necesario para recibir webhooks de la organización
  - ✅ Necesario para verificar firmas de webhook

**📋 Scopes incluidos automáticamente:**
- `read:org` (incluido con `write:org`)
- `read:user` (incluido con `repo`)
- `user:email` (incluido con `repo`)

#### 3.3 Verificar Permisos

Para verificar que el token tiene los permisos correctos, ejecuta:

```bash
# Navegar al directorio del proyecto
cd meshchile-github-bot

# Ejecutar diagnóstico
node scripts/diagnostico-bienvenidos.js
```

**✅ Salida esperada:**
```
🎯 7. Verificando scopes del token...
   • Scopes disponibles: repo, write:org, admin:org_hook
   ✅ repo: Disponible
   ✅ write:org: Disponible

✍️ 6. Intentando crear issue de prueba...
   ✅ Issue creado exitosamente: #123
   ✅ Issue cerrado automáticamente
```

**❌ Si ves esto, el token NO tiene los permisos correctos:**
```
🎯 7. Verificando scopes del token...
   ❌ repo: No disponible
   ❌ write:org: No disponible

✍️ 6. Intentando crear issue de prueba...
   ❌ Error creando issue: Not Found
```

#### 3.4 Problemas Comunes de Permisos

| Error | Causa | Solución |
|-------|-------|----------|
| `Not Found` al crear issues | Falta scope `repo` | Recrear token con scope `repo` |
| `Not Found` al gestionar equipos | Falta scope `write:org` | Recrear token con scope `write:org` |
| `Unauthorized` en webhooks | Falta scope `admin:org_hook` | Recrear token con scope `admin:org_hook` |
| `Resource not accessible` | Token sin permisos en la org | Verificar que el usuario sea admin/owner |

#### 3.5 Configuración de Organización

**El usuario del token debe tener permisos de Admin u Owner en la organización:**

1. Ve a https://github.com/orgs/Mesh-Chile/people
2. Buscar tu usuario
3. Verificar que tenga role **"Owner"** o **"Admin"**
4. Si es **"Member"**, solicitar promoción a admin

#### 3.6 Añadir Token al .env

```bash
# En el archivo .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Configurar reCAPTCHA

1. Ve a https://www.google.com/recaptcha/admin/create
2. Crear sitio reCAPTCHA v2 "I'm not a robot"
3. Añadir dominio (localhost para desarrollo)
4. Copiar Site Key y Secret Key
5. Añadir keys a `.env`
6. **IMPORTANTE:** Reemplazar `TU_SITE_KEY_AQUI` en `index.html`

### 5. Configurar equipos en GitHub

En la organización Mesh-Chile, crear equipos:

1. **Equipo "Comunidad"**
    - Name: `Comunidad`
    - Slug: `comunidad`
    - Description: `Equipo base para todos los miembros nuevos`

2. **Equipo "Colaboradores"**
    - Name: `Colaboradores`
    - Slug: `colaboradores`
    - Description: `Miembros activos con contribuciones`

### 6. Crear repositorio de bienvenida (opcional)

```bash
# Crear repo 'bienvenidos' en la organización para mensajes automáticos
```

## 🚀 Ejecutar

### Desarrollo
```bash
npm run dev
# Servidor en http://localhost:3000
```

### Producción
```bash
npm start
```

## 📡 Configurar Webhook de GitHub

1. Ve a https://github.com/Mesh-Chile → Settings → Webhooks
2. Click "Add webhook"
3. Configurar:
    - **Payload URL:** `https://tu-dominio.com/webhook/github`
    - **Content type:** `application/json`
    - **Secret:** Tu `GITHUB_WEBHOOK_SECRET` (del .env)
    - **SSL verification:** Enable SSL verification
    - **Events:** Seleccionar individual events:
        - ✅ Repositories
        - ✅ Pushes
        - ✅ Pull requests
        - ✅ Issues
    - **Active:** ✅

## 🛡️ Características de Seguridad

- **Rate limiting:** 3 invitaciones por IP cada 15 minutos
- **reCAPTCHA:** Verificación obligatoria para invitaciones
- **Webhook signature:** Verificación de autenticidad de webhooks
- **Input validation:** Validación estricta de todos los inputs
- **Audit logging:** Log completo de todas las acciones
- **CORS configurado:** Solo dominios autorizados
- **Error handling:** Manejo seguro de errores sin exponer información sensible

## 📊 Endpoints de la API

### Públicos
- `POST /api/invite` - Solicitar invitación
- `GET /api/user/:username` - Preview de usuario
- `GET /api/bot/status` - Estado del bot
- `GET /api/stats` - Estadísticas básicas

### Webhook
- `POST /webhook/github` - Webhook de GitHub

### Admin
- `POST /api/admin/promote/:username` - Promoción manual

## 🔧 Estructura del Proyecto

```
meshchile-github-bot/
├── server.js              # Servidor principal
├── package.json           # Dependencias
├── .env                   # Variables de entorno (NO SUBIR)
├── .gitignore            # Archivos a ignorar
├── README.md             # Documentación
└── public/               # Frontend
    └── index.html        # Página de invitaciones
```

## 🚀 Despliegue
### 🐳 Docker

#### Estructura organizada
```
docker/
├── Dockerfile              # Imagen optimizada
├── docker-compose.yml      # Producción (registry)
├── docker-compose.dev.yml  # Desarrollo (build local)
└── README.md              # Documentación Docker
```

#### Uso rápido desde el root del proyecto

**Desarrollo:**
```bash
npm run docker:dev          # Build y ejecutar en foreground
npm run docker:dev:detached # Build y ejecutar en background
```

**Producción:**
```bash
npm run docker:prod         # Usar imagen del registry
```

**Gestión:**
```bash
npm run docker:stop         # Parar contenedores
npm run docker:logs         # Ver logs en tiempo real
npm run docker:rebuild      # Rebuild completo desde cero
```

#### Manual (desde directorio docker/)
```bash
cd docker

# Desarrollo
docker-compose -f docker-compose.dev.yml up --build

# Producción
docker-compose up -d
```

#### Imagen en GitHub Container Registry
- **Registry**: `ghcr.io/mesh-chile/meshchile-github-invite-bot`
- **Build automático**: GitHub Actions en push a main/develop
- **Multi-arch**: linux/amd64, linux/arm64
  
### Opción 2: Railway (Recomendado)
```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

### Opción 3: Render
1. Conectar repositorio en Render.com
2. Configurar variables de entorno en el panel
3. Deploy automático

### Opción 4: Heroku
```bash
heroku create meshchile-github-bot
heroku config:set GITHUB_TOKEN=tu_token
heroku config:set GITHUB_ORG=Mesh-Chile
heroku config:set RECAPTCHA_SECRET_KEY=tu_secret
# ... configurar todas las variables
git push heroku main
```

### Opción 5: VPS/Servidor propio
```bash
# Usar PM2 para proceso en background
npm install -g pm2
pm2 start server.js --name meshchile-bot
pm2 startup
pm2 save

# Con nginx como reverse proxy
```

## 🧪 Testing

### Test local de invitación
1. Ejecutar servidor: `npm run dev`
2. Ir a `http://localhost:3000`
3. Ingresar username válido de GitHub
4. Completar reCAPTCHA
5. Verificar que llegue invitación

### Test de promoción automática
1. Usuario acepta invitación y es añadido a "Comunidad"
2. Usuario crea repo o hace commit en la organización
3. Webhook debe promocionar a "Colaboradores"
4. Verificar issue de felicitación creado

### Verificar webhooks
```bash
# Ver logs en tiempo real
tail -f logs/app.log

# O con PM2
pm2 logs meshchile-bot
```

## 📈 Monitoreo

### Endpoints de estado
- `GET /api/bot/status` - Estado detallado del sistema
- `GET /api/stats` - Estadísticas de la organización

### Logs importantes
- ✅ Invitaciones exitosas
- ❌ Errores de invitación
- 🚀 Promociones automáticas
- ⚠️  Rate limits alcanzados
- 📡 Webhooks recibidos

## 🆘 Troubleshooting

### Problema: Usuario no recibe invitación
- Verificar que el token tenga permisos `admin:org`
- Comprobar que el usuario existe en GitHub
- Revisar logs para errores específicos

### Problema: Promoción automática no funciona
- Verificar configuración del webhook
- Comprobar que los equipos existan con los slugs correctos
- Verificar que el webhook secret coincida

### Problema: reCAPTCHA no funciona
- Verificar que las keys estén correctas
- Comprobar que el dominio esté registrado en reCAPTCHA
- Verificar que el Site Key esté en el frontend

### Problema: Rate limiting muy restrictivo
- Ajustar valores en el código
- Implementar whitelist para IPs confiables
- Usar Redis para rate limiting más sofisticado

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Añadir nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

GNU Affero General Public License v3 License - ver archivo [License](./LICENSE) para detalles

## 📞 Soporte

- **Issues:** GitHub Issues del repositorio
- **Email:** info@meshchile.cl
- **Enlaces:** https://links.meshchile.cl
- **Documentación:** https://foro.meshchile.cl

---

**Desarrollado con ❤️ por [Raztor](https://github.com/raztor) para la comunidad [MeshChile](https://links.meshchile.cl)**
