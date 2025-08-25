# 🛡️ Administración - MeshChile GitHub Bot

Guía completa para administradores del sistema de invitaciones y promoción automática de MeshChile.

## 👨‍💼 Responsabilidades del Administrador

### Gestión Diaria
- 📊 **Monitorear** estado del sistema y métricas
- 👥 **Revisar** promociones automáticas diarias
- 🚨 **Responder** a alertas y problemas
- 📋 **Gestionar** invitaciones manuales cuando sea necesario

### Mantenimiento del Sistema
- 🔄 **Actualizar** configuraciones según necesidades
- 🔐 **Rotar** tokens y secrets periódicamente
- 📦 **Desplegar** nuevas versiones
- 💾 **Mantener** backups y logs

### Gestión de Usuarios
- ✅ **Aprobar** casos especiales de promoción
- ❌ **Revocar** accesos cuando sea necesario
- 🆘 **Resolver** problemas de usuarios
- 📈 **Analizar** patrones de actividad

## 🔐 Acceso Administrativo

### Endpoints de Admin

**Promoción Manual:**
```bash
curl -X POST https://invite.meshchile.cl/api/admin/promote/username \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "tu_admin_key_secreto",
    "reason": "Contribución excepcional al proyecto X"
  }'
```

**Estado del Sistema:**
```bash
curl https://invite.meshchile.cl/api/bot/status
```

### Variables de Admin

```bash
# En .env
ADMIN_KEY=tu_clave_super_secreta_para_admins_123
GITHUB_TOKEN=ghp_token_con_permisos_admin_org
```

## 📊 Dashboard de Administración

### Métricas Clave a Monitorear

**Sistema:**
- ✅ **Uptime**: Debe ser > 99%
- ⚡ **Response Time**: < 500ms promedio
- 💾 **Memory Usage**: < 200MB
- 🔄 **Error Rate**: < 1%

**Usuarios:**
- 📈 **Invitaciones/día**: Promedio y picos
- 🚀 **Promociones/día**: Automáticas vs manuales
- 👥 **Usuarios activos**: Miembros vs colaboradores
- 🐛 **Errores reportados**: Frecuencia y tipos

**GitHub API:**
- 🔢 **Rate Limit Usage**: < 80% del límite
- ⏱️ **API Latency**: < 2 segundos
- ❌ **API Errors**: Tipos y frecuencia
- 🔄 **Webhook Deliveries**: Success rate > 95%

### Comandos de Monitoreo

**Estado del servidor:**
```bash
# Logs en tiempo real
tail -f logs/app.log

# Con Docker
docker-compose logs -f meshchile-bot

# Proceso y memoria
ps aux | grep node
free -h
```

**Estado de GitHub:**
```bash
# Verificar conectividad
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# Estado de la organización
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/orgs/Mesh-Chile
```

## 👥 Gestión de Usuarios

### Promoción Manual

**Casos para promoción manual:**
- 🎯 **Contribuciones especiales** no detectadas automáticamente
- 🏆 **Reconocimiento** por logros destacados
- 🔧 **Corrección** de promociones fallidas
- 🆘 **Solicitudes especiales** vía soporte

**Proceso:**
```bash
# 1. Verificar usuario es miembro de Comunidad
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/orgs/Mesh-Chile/teams/comunidad/members/username"

# 2. Promocionar manualmente
curl -X POST https://invite.meshchile.cl/api/admin/promote/username \
  -H "Content-Type: application/json" \
  -d '{
    "adminKey": "tu_admin_key",
    "reason": "Contribución excepcional: documentación completa del proyecto Y"
  }'

# 3. Verificar promoción exitosa
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/orgs/Mesh-Chile/teams/colaboradores/members/username"
```

### Revocación de Acceso

**Cuándo revocar:**
- 🚫 **Violación** de código de conducta
- 💼 **Inactividad** prolongada (>6 meses)
- 🔐 **Problemas de seguridad**
- 📋 **Solicitud del usuario**

**Proceso manual en GitHub:**
1. Ve a [Mesh-Chile/people](https://github.com/orgs/Mesh-Chile/people)
2. Busca el usuario
3. Click en **"Remove from organization"**
4. Confirmar remoción

### Invitaciones Manuales

**Casos especiales:**
- 🎯 **VIPs** o **speakers** de eventos
- 🤝 **Partners** de organizaciones aliadas
- 🔧 **Usuarios con problemas** técnicos
- 📧 **Solicitudes por email** directo

**Proceso con GitHub CLI:**
```bash
# Instalar GitHub CLI
gh auth login

# Enviar invitación directa
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /orgs/Mesh-Chile/invitations \
  -f invitee_id=12345 \
  -f role=direct_member

# Agregar a equipo Comunidad
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /orgs/Mesh-Chile/teams/comunidad/memberships/username
```

## 🔧 Mantenimiento del Sistema

### Rotación de Secrets

**Cada 3-6 meses rotar:**

**GitHub Token:**
```bash
# 1. Crear nuevo token en GitHub
# 2. Actualizar en .env
GITHUB_TOKEN=ghp_nuevo_token_xxx

# 3. Reiniciar servicio
docker-compose restart

# 4. Verificar funcionalidad
node scripts/diagnostico-bienvenidos.js

# 5. Revocar token anterior en GitHub
```

**Webhook Secret:**
```bash
# 1. Generar nuevo secret
openssl rand -hex 32

# 2. Actualizar en GitHub webhook settings
# 3. Actualizar en .env
GITHUB_WEBHOOK_SECRET=nuevo_secret_xxx

# 4. Reiniciar servicio
# 5. Probar webhook
node scripts/test-repository.js testuser
```

**Admin Key:**
```bash
# 1. Generar nueva clave
openssl rand -base64 32

# 2. Actualizar en .env
ADMIN_KEY=nueva_clave_admin_xxx

# 3. Actualizar scripts de admin
# 4. Reiniciar servicio
```

### Actualizaciones del Sistema

**Proceso de actualización:**
```bash
# 1. Backup de configuración
cp .env .env.backup
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# 2. Pull de cambios
git pull origin main

# 3. Actualizar dependencias
npm install

# 4. Ejecutar tests
npm test

# 5. Rebuild Docker image
docker-compose build

# 6. Deploy con zero-downtime
docker-compose up -d

# 7. Verificar funcionalidad
curl https://invite.meshchile.cl/api/bot/status
```

### Backup y Recovery

**Backup diario automático:**
```bash
#!/bin/bash
# backup.sh - Ejecutar via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/meshchile-bot"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de configuración
cp .env $BACKUP_DIR/env_$DATE
cp docker-compose.yml $BACKUP_DIR/compose_$DATE

# Backup de logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz logs/

# Limpiar backups > 30 días
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "env_*" -mtime +30 -delete
```

**Cron job para backup:**
```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 3 AM
0 3 * * * /path/to/backup.sh

# Verificar logs de backup
tail -f /var/log/cron
```

## 🚨 Manejo de Emergencias

### Problemas Críticos

**Sistema Down:**
```bash
# 1. Verificar estado del contenedor
docker-compose ps

# 2. Ver logs de error
docker-compose logs meshchile-bot

# 3. Restart rápido
docker-compose restart

# 4. Si persiste, rollback
git checkout HEAD~1
docker-compose up -d --build

# 5. Notificar al equipo
```

**GitHub API Rate Limit Agotado:**
```bash
# 1. Verificar status
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# 2. Si está agotado, esperar reset
# 3. Implementar rate limiting más agresivo temporalmente
# 4. Investigar causa del exceso de uso
```

**Promociones Masivas Incorrectas:**
```bash
# 1. Pausar webhook processing (comentar líneas en código)
# 2. Identificar usuarios promocionados incorrectamente
# 3. Revocar promociones manualmente en GitHub
# 4. Investigar causa root
# 5. Implementar fix
# 6. Reactivar sistema
```

### Plan de Contingencia

**Contactos de Emergencia:**
- 👨‍💻 **Developer Principal**: raztor@meshchile.cl
- 🛠️ **DevOps**: devops@meshchile.cl
- 👥 **Community Manager**: info@meshchile.cl

**Canales de Comunicación:**
- 🚨 **Slack**: #emergencias-bot
- 📧 **Email**: emergencias@meshchile.cl
- 📱 **WhatsApp**: Grupo admins MeshChile

**Escalación:**
1. **5 minutos**: Notificar en Slack
2. **15 minutos**: Email a toda la lista
3. **30 minutos**: Llamadas telefónicas
4. **60 minutos**: Reunión de emergencia

## 📋 Auditoría y Compliance

### Logs de Auditoría

**Eventos a auditar:**
```bash
# Filtrar eventos críticos
grep "ADMIN_PROMOTE\|INVITE_SUCCESS\|PROMOTION_SUCCESS" logs/app.log

# Promociones del último mes
grep "promovido a Colaborador" logs/app.log | grep "$(date +%Y-%m)"

# Errores de autenticación
grep "No autorizado\|Invalid signature" logs/app.log
```

**Reporte mensual:**
```bash
#!/bin/bash
# monthly-report.sh

MONTH=$(date +%Y-%m)
REPORT_FILE="report_$MONTH.txt"

echo "=== REPORTE MENSUAL MESHCHILE BOT - $MONTH ===" > $REPORT_FILE
echo "" >> $REPORT_FILE

echo "INVITACIONES EXITOSAS:" >> $REPORT_FILE
grep "INVITE_SUCCESS" logs/app.log | grep $MONTH | wc -l >> $REPORT_FILE

echo "PROMOCIONES AUTOMÁTICAS:" >> $REPORT_FILE
grep "promovido a Colaborador" logs/app.log | grep $MONTH | wc -l >> $REPORT_FILE

echo "PROMOCIONES MANUALES:" >> $REPORT_FILE
grep "ADMIN_PROMOTE.*true" logs/app.log | grep $MONTH | wc -l >> $REPORT_FILE

echo "ERRORES CRÍTICOS:" >> $REPORT_FILE
grep "ERROR\|CRITICAL" logs/app.log | grep $MONTH | wc -l >> $REPORT_FILE
```

### Compliance y Seguridad

**Checklist mensual:**
- [ ] ✅ Rotación de secrets completada
- [ ] 📊 Reporte de auditoría generado
- [ ] 🔐 Revisión de permisos de usuarios
- [ ] 💾 Verificación de backups
- [ ] 🔄 Tests de recovery ejecutados
- [ ] 📈 Análisis de métricas de performance
- [ ] 🚨 Revisión de alertas y incidentes
- [ ] 📋 Actualización de documentación

**Políticas de Retención:**
- **Logs**: 90 días en sistema, 1 año en backup
- **Métricas**: 6 meses detalladas, 2 años agregadas
- **Backups**: 30 días locales, 1 año remotos
- **Audit trails**: Permanente (compresión anual)

## 📊 Reportes y Analytics

### Dashboard Personalizado

**Métricas clave (Grafana/custom):**
```yaml
Invitaciones:
  - Total por día/semana/mes
  - Success rate
  - Errores por tipo
  - Tiempo de processing

Promociones:
  - Automáticas por tipo de evento
  - Manuales por razón
  - Tiempo promedio desde invitación
  - Distribución por repositorios

Sistema:
  - Uptime
  - Response times
  - Memory/CPU usage
  - Error rates
```

### Scripts de Reporting

**Weekly summary:**
```bash
# weekly-summary.sh
#!/bin/bash

WEEK_START=$(date -d "last monday" +%Y-%m-%d)
WEEK_END=$(date -d "next sunday" +%Y-%m-%d)

echo "📊 RESUMEN SEMANAL: $WEEK_START a $WEEK_END"
echo ""

echo "🎫 INVITACIONES:"
grep "INVITE_SUCCESS" logs/app.log | \
  awk -v start="$WEEK_START" -v end="$WEEK_END" \
  '$1 >= start && $1 <= end' | wc -l

echo "🚀 PROMOCIONES:"
grep "promovido a Colaborador" logs/app.log | \
  awk -v start="$WEEK_START" -v end="$WEEK_END" \
  '$1 >= start && $1 <= end' | wc -l

echo "❌ ERRORES:"
grep "ERROR" logs/app.log | \
  awk -v start="$WEEK_START" -v end="$WEEK_END" \
  '$1 >= start && $1 <= end' | wc -l
```

---

**🛡️ Administración activa** ✅  
**📊 Monitoreo continuo** ✅  
**🔐 Seguridad mantenida** ✅  
**👥 Usuarios gestionados** ✅
