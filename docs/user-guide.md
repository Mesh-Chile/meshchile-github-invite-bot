# 👤 Guía de Usuario - MeshChile GitHub Bot

Guía completa para usuarios finales sobre cómo solicitar invitaciones y participar en la comunidad MeshChile.

## 🌟 ¿Qué es MeshChile GitHub Bot?

El bot de MeshChile es un sistema automatizado que facilita el ingreso y promoción dentro de la organización GitHub de MeshChile. Te ayuda a:

- 🎫 **Solicitar invitación** a la organización de forma automática
- 👥 **Unirte al equipo "Comunidad"** al aceptar la invitación
- 🚀 **Promoción automática** a "Colaboradores" basada en tus contribuciones
- 🎉 **Reconocimiento público** cuando seas promovido

## 🚀 Cómo Solicitar una Invitación

### 1. Acceder al Bot

Visita: **https://gh-invite.meshchile.cl**

### 2. Completar el Formulario

**Información requerida:**
- ✅ **Username de GitHub**: Tu nombre de usuario exacto
- 🤖 **Verificación reCAPTCHA**: Completar "No soy un robot"

**Ejemplo:**
```
GitHub Username: tu-username
reCAPTCHA: ✅ Verificado
```

### 3. Enviar Solicitud

Click en **"Solicitar Invitación"**

**Respuestas posibles:**

✅ **Éxito:**
```
🎉 ¡Invitación enviada exitosamente a tu-username!
📧 Revisa tu email para aceptar la invitación
👥 Serás agregado automáticamente al equipo "Comunidad"
```

❌ **Error común:**
```
❌ Usuario no encontrado en GitHub
❌ El usuario ya es miembro de la organización
❌ Demasiadas solicitudes (intenta en 15 minutos)
```

### 4. Aceptar Invitación

1. **Revisa tu email** (bandeja de entrada y spam)
2. **Click en "Accept invitation"** en el email de GitHub
3. **Confirma** que quieres unirte a Mesh-Chile
4. ✅ **¡Listo!** Ya eres miembro del equipo "Comunidad"

## 📈 Sistema de Promoción Automática

### ¿Cómo Funciona?

Una vez que eres miembro del equipo "Comunidad", el bot monitorea automáticamente tus contribuciones. Cuando realizas actividades significativas, eres promovido automáticamente a "Colaboradores".

### 🎯 Actividades que Disparan Promoción

| Actividad | Descripción | Promoción |
|-----------|-------------|-----------|
| 📦 **Crear Repositorio** | Crear un repo en la organización | ✅ Automática |
| 💻 **Push Commits** | Hacer push con commits a cualquier repo | ✅ Automática |
| 🔄 **Abrir Pull Request** | Crear un PR en cualquier repositorio | ✅ Automática |
| 🐛 **Crear Issue** | Reportar bugs o sugerir mejoras | ✅ Automática |

### ⏱️ ¿Cuándo Ocurre?

La promoción es **inmediata**:
1. Realizas una contribución
2. GitHub envía evento al bot
3. Bot verifica que eres miembro "Comunidad"
4. **¡Promoción automática a "Colaboradores"!**
5. Recibes felicitación pública en el repo "bienvenidos"

## 🎉 Beneficios de Ser Colaborador

### Permisos Adicionales

Como **Colaborador** obtienes:

- ✅ **Acceso de escritura** a repositorios donde participas
- ✅ **Revisar Pull Requests** de otros miembros
- ✅ **Gestionar Issues** (asignar, etiquetar, cerrar)
- ✅ **Crear ramas** directamente en repos
- ✅ **Merge de PRs** (con aprobación)

### Reconocimiento Público

Cuando seas promovido:

1. 📧 **Issue de felicitación** creado en [github.com/Mesh-Chile/bienvenidos](https://github.com/Mesh-Chile/bienvenidos)
2. 🏷️ **Etiquetas públicas** con tu promoción
3. 👥 **Visibilidad** en el equipo de colaboradores
4. 🎖️ **Badge** de colaborador en tu perfil de organización

### Ejemplo de Mensaje de Felicitación

```markdown
🎉 ¡Felicitaciones @tu-username! Promovido a Colaborador

¡Hola @tu-username!

🎉 **¡Felicitaciones!** Has sido promovido automáticamente al equipo 
**Colaboradores** de MeshChile.

**Razón de la promoción:** Creó repositorio

Como colaborador ahora tienes:
✅ Acceso de escritura a los repositorios en los que participas
✅ Posibilidad de revisar Pull Requests
✅ Capacidad de crear y gestionar Issues
✅ Reconocimiento como miembro activo de la comunidad

¡Gracias por ser parte activa de MeshChile! 🚀
```

## 🛠️ Cómo Contribuir para Ser Promovido

### 1. Crear tu Primer Repositorio

**Opciones:**
- 🔧 **Proyecto personal** relacionado con Meshtastic
- 📚 **Documentación** de tu experiencia
- 🛠️ **Tools/Scripts** útiles para la comunidad
- 🎨 **Recursos creativos** (logos, designs, etc.)

**Pasos:**
1. Ve a [github.com/Mesh-Chile](https://github.com/Mesh-Chile)
2. Click **"New repository"**
3. Nombra tu proyecto (ej: `mi-proyecto-meshtastic`)
4. Agrega descripción
5. **Create repository**
6. ✅ **¡Promoción automática!**

### 2. Contribuir a Proyectos Existentes

**Formas de contribuir:**

**📝 Mejorar Documentación:**
```bash
# Fork del proyecto
git clone https://github.com/tu-usuario/proyecto-forked.git
cd proyecto-forked

# Crear rama para tu contribución
git checkout -b docs/mejorar-readme

# Hacer cambios
echo "# Mejoras al README" >> README.md

# Commit y push
git add .
git commit -m "docs: mejorar documentación del README"
git push origin docs/mejorar-readme
```

**🐛 Reportar Bugs:**
1. Ve al repositorio del proyecto
2. Click **"Issues"** → **"New issue"**
3. Describe el problema detalladamente
4. Agrega pasos para reproducir
5. **Submit issue** → ✅ **¡Promoción automática!**

**🔄 Crear Pull Requests:**
1. Fork del repositorio
2. Crear rama con tu mejora
3. Hacer commits con cambios
4. **Create Pull Request** → ✅ **¡Promoción automática!**

### 3. Participar en Discusiones

**GitHub Discussions:**
- 💬 Responder preguntas de otros miembros
- 🆘 Pedir ayuda con tus proyectos
- 💡 Compartir ideas y sugerencias
- 🔗 Compartir recursos útiles

**Issues Comments:**
- 👍 Reaccionar a issues relevantes
- 📝 Agregar información adicional
- 🔍 Ayudar en troubleshooting
- ✅ Confirmar bugs reportados

## 📊 Ver tu Estado Actual

### Verificar Membresía

**Método 1: GitHub Web**
1. Ve a [github.com/Mesh-Chile](https://github.com/Mesh-Chile)
2. Click **"People"**
3. Busca tu username
4. Verifica tu role: `Member` o `Collaborator`

**Método 2: API**
```bash
# Verificar si eres miembro
curl https://api.github.com/orgs/Mesh-Chile/members/tu-username

# 200 = Eres miembro público
# 404 = No eres miembro o membresía privada
```

### Verificar Equipo Actual

1. Ve a [github.com/orgs/Mesh-Chile/teams](https://github.com/orgs/Mesh-Chile/teams)
2. Click en **"Comunidad"** o **"Colaboradores"**
3. Busca tu username en la lista

## 🚨 Problemas Comunes y Soluciones

### No Recibo la Invitación

**Posibles causas:**
1. 📧 **Email en spam** - Revisa carpeta de spam
2. 🔒 **Configuración de privacidad** - Verifica settings de GitHub
3. ⏰ **Delay en entrega** - Puede tomar hasta 10 minutos
4. 📝 **Username incorrecto** - Verifica que sea exacto

**Soluciones:**
```bash
# 1. Verificar username existe
https://github.com/tu-username

# 2. Verificar configuración de notificaciones
GitHub → Settings → Notifications → Email

# 3. Intentar nuevamente después de 15 minutos
```

### Ya Soy Miembro pero No del Equipo

**Qué hacer:**
1. 📧 **Contactar admins** - info@meshchile.cl
2. 💬 **Discord** - Preguntar en [links.meshchile.cl](https://links.meshchile.cl)
3. 🐛 **Crear issue** - En el repositorio del bot

### No Me Promocionan Automáticamente

**Verificar:**
1. ✅ **Eres miembro** del equipo "Comunidad"
2. ✅ **Tu contribución** fue en un repo de Mesh-Chile
3. ✅ **No eres ya** miembro de "Colaboradores"

**Debug:**
- Revisar [repo bienvenidos](https://github.com/Mesh-Chile/bienvenidos) para issues recientes
- Verificar que tu username aparezca en los logs de actividad

### Rate Limit Alcanzado

**Mensaje:**
```
❌ Demasiadas solicitudes. Intenta nuevamente en 15 minutos.
```

**Solución:**
- ⏰ **Esperar 15 minutos** antes de intentar nuevamente
- 🌐 **Cambiar red** (si estás en red compartida)
- 📱 **Usar datos móviles** temporalmente

## 💬 Soporte y Ayuda

### Canales Oficiales

**🆘 Soporte Técnico:**
- **Issues**: [GitHub Issues del Bot](https://github.com/Mesh-Chile/meshchile-github-invite-bot/issues)
- **Email**: info@meshchile.cl

**👥 Comunidad:**
- **Discord**: [Servidor MeshChile](https://links.meshchile.cl)
- **Foro**: [foro.meshchile.cl](https://foro.meshchile.cl)
- **Telegram**: Grupos oficiales de MeshChile

### Información de Contacto

**📧 Email de Soporte:**
```
Para: info@meshchile.cl
Asunto: [Bot GitHub] Problema con invitación

Hola,

Estoy teniendo problemas con:
- Username GitHub: tu-username
- Problema: descripción detallada
- Pasos realizados: lo que ya intentaste

Gracias!
```

**🐛 Reportar Bug:**
1. Ve a [Issues del repositorio](https://github.com/Mesh-Chile/meshchile-github-invite-bot/issues)
2. Click **"New issue"**
3. Usar template de bug report
4. Incluir toda la información relevante

## 📚 Recursos Adicionales

### Documentación GitHub

- **[GitHub Docs](https://docs.github.com)** - Documentación oficial
- **[Git Handbook](https://guides.github.com/introduction/git-handbook/)** - Guía de Git
- **[GitHub Flow](https://guides.github.com/introduction/flow/)** - Workflow recomendado

### Recursos MeshChile

- **[Website](https://meshchile.cl)** - Sitio web oficial
- **[Links](https://links.meshchile.cl)** - Todos los enlaces importantes
- **[Foro](https://foro.meshchile.cl)** - Discusiones técnicas
- **[Documentación](https://docs.meshchile.cl)** - Docs técnicas

---

**🎯 ¡Bienvenido a MeshChile!** 🚀  
**👥 Comunidad activa** ✅  
**🔄 Promoción automática** ✅  
**🆘 Soporte disponible** ✅
