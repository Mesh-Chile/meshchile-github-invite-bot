# 🚀 Deployment - MeshChile GitHub Bot

Guía completa de despliegue para diferentes plataformas y entornos del sistema de invitaciones y promoción automática.

## 🌐 Opciones de Deployment

### 📊 Comparación de Plataformas

| Plataforma | Facilidad | Costo | Escalabilidad | Recomendado Para |
|------------|-----------|-------|---------------|------------------|
| **Railway** | ⭐⭐⭐⭐⭐ | $ | ⭐⭐⭐⭐ | Desarrollo y producción |
| **Render** | ⭐⭐⭐⭐ | $ | ⭐⭐⭐ | Proyectos pequeños |
| **Heroku** | ⭐⭐⭐⭐ | $$ | ⭐⭐⭐ | Empresas establecidas |
| **VPS/Cloud** | ⭐⭐ | $$$ | ⭐⭐⭐⭐⭐ | Control total |
| **Docker** | ⭐⭐⭐ | Variable | ⭐⭐⭐⭐⭐ | Cualquier entorno |

## 🚄 Railway (Recomendado)

### Ventajas
- ✅ Deploy automático desde GitHub
- ✅ Variables de entorno fáciles de gestionar
- ✅ SSL/HTTPS automático
- ✅ Scaling automático
- ✅ Logs centralizados
- ✅ $5/mes plan starter

### Deployment en Railway

**1. Preparación:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login
```

**2. Configuración inicial:**
```bash
# En el directorio del proyecto
railway init

# Conectar con repositorio existente
railway link

# Configurar variables de entorno
railway variables set GITHUB_TOKEN=ghp_xxxxx
railway variables set GITHUB_ORG=Mesh-Chile
railway variables set RECAPTCHA_SECRET_KEY=6LcYYYYYY
railway variables set GITHUB_WEBHOOK_SECRET=tu_secret
```

**3. Deploy:**
```bash
# Deploy inicial
railway up

# Deploy automático configurado con GitHub
# Cada push a main = deploy automático
```

**4. Configuración de dominio:**
```bash
# Generar dominio Railway
railway domain

# Dominio personalizado (opcional)
railway domain add invite.meshchile.cl
```

**5. Configuración del webhook GitHub:**
```
URL: https://tu-app.railway.app/webhook/github
Secret: valor de GITHUB_WEBHOOK_SECRET
Events: repository, push, pull_request, issues
```

### railway.json (Opcional)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "healthcheckPath": "/api/bot/status",
    "healthcheckTimeout": 10
  }
}
```

## 🎨 Render

### Deployment en Render

**1. Configuración en Render.com:**
- Conectar repositorio GitHub
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: `Node`

**2. Variables de entorno en Render:**
```env
GITHUB_TOKEN=ghp_xxxxx
GITHUB_ORG=Mesh-Chile
RECAPTCHA_SECRET_KEY=6LcYYYYYY
GITHUB_WEBHOOK_SECRET=tu_secret
NODE_ENV=production
PORT=10000
```

**3. Auto-deploy:**
- ✅ Auto-deploy habilitado en branch `main`
- ✅ Health checks en `/api/bot/status`

### render.yaml (Deploy automático)
```yaml
services:
  - type: web
    name: meshchile-github-bot
    env: node
    buildCommand: npm install
    startCommand: npm start
    plan: starter
    healthCheckPath: /api/bot/status
    envVars:
      - key: NODE_ENV
        value: production
      - key: GITHUB_TOKEN
        sync: false
      - key: GITHUB_ORG
        value: Mesh-Chile
```

## 🟣 Heroku

### Deployment en Heroku

**1. Preparación:**
```bash
# Instalar Heroku CLI
# Descargar desde https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Crear app
heroku create meshchile-github-bot
```

**2. Configurar variables:**
```bash
heroku config:set GITHUB_TOKEN=ghp_xxxxx
heroku config:set GITHUB_ORG=Mesh-Chile
heroku config:set RECAPTCHA_SECRET_KEY=6LcYYYYYY
heroku config:set GITHUB_WEBHOOK_SECRET=tu_secret
heroku config:set NODE_ENV=production
```

**3. Deploy:**
```bash
# Deploy inicial
git push heroku main

# Ver logs
heroku logs --tail

# Verificar status
heroku ps:scale web=1
```

**4. Configurar dominio:**
```bash
# Agregar dominio personalizado
heroku domains:add invite.meshchile.cl

# Configurar SSL
heroku certs:auto:enable
```

### Procfile
```
web: npm start
```

### app.json (Review apps)
```json
{
  "name": "MeshChile GitHub Bot",
  "description": "Sistema de invitaciones y promoción automática",
  "repository": "https://github.com/Mesh-Chile/meshchile-github-invite-bot",
  "env": {
    "GITHUB_TOKEN": {
      "description": "GitHub Personal Access Token"
    },
    "GITHUB_ORG": {
      "value": "Mesh-Chile"
    },
    "NODE_ENV": {
      "value": "production"
    }
  },
  "formation": {
    "web": {
      "quantity": 1,
      "size": "basic"
    }
  }
}
```

## 🐳 Docker Deployment

### Docker Standalone

**1. Build y run:**
```bash
# Build imagen
cd docker
docker build -t meshchile-bot .

# Run container
docker run -d \
  --name meshchile-bot \
  --env-file ../.env \
  -p 3000:3000 \
  --restart unless-stopped \
  meshchile-bot
```

**2. Con Docker Compose:**
```bash
# Producción
cd docker
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up --build
```

### Docker Swarm

**docker-stack.yml:**
```yaml
version: '3.8'

services:
  meshchile-bot:
    image: ghcr.io/mesh-chile/meshchile-github-invite-bot:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/bot/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  default:
    external: true
    name: meshchile-network
```

**Deploy en Swarm:**
```bash
# Inicializar swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-stack.yml meshchile

# Verificar
docker service ls
docker service logs meshchile_meshchile-bot
```

## ☁️ VPS/Cloud Deployment

### Ubuntu/Debian VPS

**1. Preparación del servidor:**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y nodejs npm git nginx certbot python3-certbot-nginx

# Instalar PM2
sudo npm install -g pm2

# Crear usuario para la app
sudo useradd -m -s /bin/bash meshchile
sudo usermod -aG sudo meshchile
```

**2. Setup de la aplicación:**
```bash
# Cambiar a usuario meshchile
sudo su - meshchile

# Clonar repositorio
git clone https://github.com/Mesh-Chile/meshchile-github-invite-bot.git
cd meshchile-github-invite-bot

# Instalar dependencias
npm install --production

# Configurar .env
cp .env.example .env
nano .env
```

**3. Configurar PM2:**
```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'meshchile-bot',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};

# Iniciar aplicación
pm2 start ecosystem.config.js

# Auto-start en boot
pm2 startup
pm2 save
```

**4. Configurar Nginx:**
```nginx
# /etc/nginx/sites-available/meshchile-bot
server {
    listen 80;
    server_name invite.meshchile.cl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/meshchile-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL con Let's Encrypt
sudo certbot --nginx -d invite.meshchile.cl
```

## 🔄 CI/CD Automation

### GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  release:
    types: [ published ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test

  deploy-railway:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    - uses: railwayapp/cli@v3
      with:
        railway-token: ${{ secrets.RAILWAY_TOKEN }}
    - run: railway up --detach

  deploy-docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: docker/build-push-action@v5
      with:
        context: .
        file: ./docker/Dockerfile
        push: true
        tags: ghcr.io/mesh-chile/meshchile-github-invite-bot:latest
```

### Auto-deployment Script

**deploy.sh:**
```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deployment..."

# Backup actual
echo "💾 Creando backup..."
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .env logs/

# Pull cambios
echo "📥 Descargando cambios..."
git pull origin main

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --production

# Tests
echo "🧪 Ejecutando tests..."
npm test

# Restart aplicación
echo "🔄 Reiniciando aplicación..."
pm2 reload ecosystem.config.js

# Verificar health
echo "🏥 Verificando salud..."
sleep 5
curl -f http://localhost:3000/api/bot/status || exit 1

echo "✅ Deployment completado exitosamente!"
```

## 🔧 Configuración Post-Deployment

### Health Checks

**Endpoint de salud:**
```bash
# Verificar que la aplicación responde
curl https://invite.meshchile.cl/api/bot/status

# Respuesta esperada:
{
  "status": "active",
  "uptime": 3600,
  "environment": "production"
}
```

**Monitoreo continuo:**
```bash
# Uptime monitoring con cron
*/5 * * * * curl -f https://invite.meshchile.cl/api/bot/status || echo "Bot down" | mail -s "Alert" admin@meshchile.cl
```

### SSL/HTTPS Setup

**Cloudflare (Recomendado):**
1. Agregar dominio a Cloudflare
2. Configurar DNS: `invite.meshchile.cl` → IP del servidor
3. SSL: Full (strict)
4. Caching: Development mode durante setup

**Let's Encrypt (Manual):**
```bash
# Con certbot
sudo certbot --nginx -d invite.meshchile.cl

# Renovación automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Bloquear acceso directo al puerto 3000
sudo ufw deny 3000/tcp
```

## 📊 Production Monitoring

### Essential Monitoring

**Application metrics:**
```bash
# PM2 monitoring
pm2 monit

# Logs en tiempo real
pm2 logs meshchile-bot --lines 100

# Status
pm2 status
```

**System metrics:**
```bash
# Recursos del sistema
htop
df -h
free -h
iostat -x 1
```

### External Monitoring

**Uptime Robot:**
- Monitor: `https://invite.meshchile.cl/api/bot/status`
- Interval: 5 minutos
- Alerts: Email + Slack

**New Relic/DataDog (Opcional):**
```bash
# Instalar agente New Relic
npm install newrelic

# newrelic.js
exports.config = {
  app_name: ['MeshChile GitHub Bot'],
  license_key: 'tu_license_key',
  logging: {
    level: 'info'
  }
};
```

## 🚨 Rollback Procedures

### Quick Rollback

```bash
# Con Git
git log --oneline -5  # Ver últimos commits
git checkout HEAD~1   # Rollback al commit anterior
pm2 reload meshchile-bot

# Con Docker
docker pull ghcr.io/mesh-chile/meshchile-github-invite-bot:v1.0.0
docker-compose up -d

# Con Railway
railway rollback
```

### Emergency Procedures

```bash
# Parar aplicación completamente
pm2 stop meshchile-bot

# Restaurar desde backup
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz

# Restart con configuración anterior
pm2 start meshchile-bot
```

---

**🚀 Deployment completado** ✅  
**🔐 SSL configurado** ✅  
**📊 Monitoring activo** ✅  
**🔄 CI/CD implementado** ✅
