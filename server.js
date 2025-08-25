// MeshChile GitHub Organization Invite System
// Backend con rate limiting, reCAPTCHA y sistema de promoción automática

const express = require('express');
const { Octokit } = require('@octokit/rest');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// =====================================
// CONFIGURACIÓN DE RATE LIMITING
// =====================================

// Rate limiter específico para invitaciones (más restrictivo)
const inviteLimiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'test' ? 1000 : (process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000), // 1s en test, 1 min en dev, 15 min en prod
    max: process.env.NODE_ENV === 'test' ? 1000 : (process.env.NODE_ENV === 'development' ? 100 : 3), // 1000 en test, 100 en dev, 3 en prod
    message: {
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`⚠️  Rate limit alcanzado para IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Demasiadas solicitudes. Intenta nuevamente en 15 minutos.'
        });
    }
});

// Rate limiter general más permisivo
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: process.env.NODE_ENV === 'test' ? 10000 : (process.env.NODE_ENV === 'development' ? 1000 : 20), // 10000 en test, 1000 en dev, 20 en prod
    message: {
        success: false,
        message: 'Demasiadas solicitudes. Intenta más tarde.'
    }
});

// Rate limiter para verificación de usuarios
const userVerificationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: process.env.NODE_ENV === 'test' ? 10000 : (process.env.NODE_ENV === 'development' ? 1000 : 10), // 10000 en test, 1000 en dev, 10 en prod
    message: {
        error: 'Demasiadas verificaciones de usuario. Intenta más tarde.'
    }
});

// =====================================
// MIDDLEWARES
// =====================================

app.use(generalLimiter);
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    credentials: true
}));
app.use(express.static('public'));

// Middleware específico para webhook (debe ir antes del express.json)
app.use('/webhook/github', express.raw({type: 'application/json'}));

// Middleware JSON para el resto de rutas
app.use(express.json({ limit: '10mb' }));

// Middleware para obtener IP real (especialmente útil con proxies/load balancers)
// Configuración avanzada de trust proxy basada en variables de entorno
const configureTrustProxy = () => {
    const trustProxy = process.env.TRUST_PROXY;

    if (trustProxy) {
        // Si se especifica explícitamente
        if (trustProxy === 'true' || trustProxy === '1') {
            app.set('trust proxy', true);
            console.log('🔗 Trust proxy: habilitado para todos los proxies');
        } else if (trustProxy === 'false' || trustProxy === '0') {
            app.set('trust proxy', false);
            console.log('🔗 Trust proxy: deshabilitado');
        } else if (trustProxy.includes(',')) {
            // Lista de IPs/subnets de proxies autorizados
            const proxies = trustProxy.split(',').map(ip => ip.trim());
            app.set('trust proxy', proxies);
            console.log(`🔗 Trust proxy: IPs autorizadas: ${proxies.join(', ')}`);
        } else if (Number.isInteger(parseInt(trustProxy))) {
            // Número de proxies
            app.set('trust proxy', parseInt(trustProxy));
            console.log(`🔗 Trust proxy: ${trustProxy} nivel(es) de proxy`);
        } else {
            // Configuración personalizada (loopback, linklocal, etc.)
            app.set('trust proxy', trustProxy);
            console.log(`🔗 Trust proxy: configuración personalizada: ${trustProxy}`);
        }
    } else {
        // Configuración por defecto basada en entorno
        if (process.env.NODE_ENV === 'production') {
            // En producción, confiar en el primer proxy (típico para Railway, Render, etc.)
            app.set('trust proxy', 1);
            console.log('🔗 Trust proxy: nivel 1 (producción)');
        } else {
            // En desarrollo, solo loopback
            app.set('trust proxy', 'loopback');
            console.log('🔗 Trust proxy: solo loopback (desarrollo)');
        }
    }
};

configureTrustProxy();

// Debug middleware para troubleshooting
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// =====================================
// CONFIGURACIÓN DE GITHUB Y RECAPTCHA
// =====================================

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const GITHUB_ORG = process.env.GITHUB_ORG || 'Mesh-Chile';
const COMMUNITY_TEAM = process.env.COMMUNITY_TEAM || 'comunidad';
const COLLABORATORS_TEAM = process.env.COLLABORATORS_TEAM || 'colaboradores';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

// =====================================
// FUNCIONES AUXILIARES
// =====================================

// Función para verificar reCAPTCHA v3
async function verifyRecaptcha(token, userIP) {
    if (!RECAPTCHA_SECRET) {
        console.warn('⚠️  RECAPTCHA_SECRET_KEY no configurado');
        return true; // Permitir en desarrollo sin reCAPTCHA
    }

    try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
            params: {
                secret: RECAPTCHA_SECRET,
                response: token,
                remoteip: userIP
            },
            timeout: 5000
        });

        const { success, score, action, 'error-codes': errorCodes } = response.data;

        if (!success) {
            console.log('❌ reCAPTCHA v3 falló:', errorCodes);
            return false;
        }

        // Para reCAPTCHA v3, verificar score (0.0 = bot, 1.0 = humano)
        const minScore = 0.5; // Ajustar según necesidades
        if (score < minScore) {
            console.log(`❌ reCAPTCHA v3 score muy bajo: ${score} < ${minScore}`);
            return false;
        }

        // Verificar que la acción coincida
        if (action !== 'github_invite') {
            console.log(`❌ reCAPTCHA v3 acción incorrecta: ${action}`);
            return false;
        }

        console.log(`✅ reCAPTCHA v3 exitoso - Score: ${score}, Action: ${action}`);
        return true;

    } catch (error) {
        console.error('Error verificando reCAPTCHA v3:', error.message);
        return false;
    }
}

// Función para log de auditoría
function auditLog(action, username, ip, success, message = '') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${success ? '✅' : '❌'} ${action}: ${username} | IP: ${ip} | ${message}`);
}

// =====================================
// RUTAS PRINCIPALES
// =====================================

// Endpoint para solicitar invitación
app.post('/api/invite', inviteLimiter, async (req, res) => {
    const startTime = Date.now();
    const userIP = req.ip || req.connection.remoteAddress;
    const { username, recaptchaToken } = req.body;

    try {
        // Validaciones básicas
        if (!username || typeof username !== 'string') {
            auditLog('INVITE_ATTEMPT', username || 'unknown', userIP, false, 'Username requerido');
            return res.status(400).json({
                success: false,
                message: 'Nombre de usuario requerido'
            });
        }

        if (!recaptchaToken && RECAPTCHA_SECRET) {
            auditLog('INVITE_ATTEMPT', username, userIP, false, 'reCAPTCHA requerido');
            return res.status(400).json({
                success: false,
                message: 'reCAPTCHA requerido'
            });
        }

        // Verificar reCAPTCHA v3
        if (RECAPTCHA_SECRET) {
            const recaptchaValid = await verifyRecaptcha(recaptchaToken, userIP);
            if (!recaptchaValid) {
                auditLog('INVITE_ATTEMPT', username, userIP, false, 'reCAPTCHA inválido');
                return res.status(400).json({
                    success: false,
                    message: 'Verificación reCAPTCHA falló. Por favor intenta nuevamente.'
                });
            }
        }

        // Validar formato del username
        const usernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
        if (!usernameRegex.test(username)) {
            auditLog('INVITE_ATTEMPT', username, userIP, false, 'Formato de username inválido');
            return res.status(400).json({
                success: false,
                message: 'Formato de nombre de usuario inválido'
            });
        }

        // Verificar si el usuario existe en GitHub
        let githubUser;
        try {
            const { data } = await octokit.rest.users.getByUsername({ username });
            githubUser = data;
        } catch (error) {
            if (error.status === 404) {
                auditLog('INVITE_ATTEMPT', username, userIP, false, 'Usuario no encontrado en GitHub');
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado en GitHub'
                });
            }
            throw error;
        }

        // Verificar si ya es miembro de la organización
        try {
            await octokit.rest.orgs.getMembershipForUser({
                org: GITHUB_ORG,
                username
            });
            auditLog('INVITE_ATTEMPT', username, userIP, false, 'Usuario ya es miembro');
            return res.status(409).json({
                success: false,
                message: 'El usuario ya es miembro de la organización'
            });
        } catch (error) {
            if (error.status !== 404) {
                throw error;
            }
            // 404 significa que no es miembro, continuar
        }

        // Intentar añadir al equipo Comunidad
        let teamAssignment = false;
        try {
            await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
                org: GITHUB_ORG,
                team_slug: COMMUNITY_TEAM,
                username: username,
                role: 'member'
            });
            teamAssignment = true;
        } catch (teamError) {
            console.warn(`⚠️  No se pudo añadir ${username} al equipo ${COMMUNITY_TEAM}: ${teamError.message}`);
        }

        const processingTime = Date.now() - startTime;
        auditLog('INVITE_SUCCESS', username, userIP, true, `Procesado en ${processingTime}ms | Equipo: ${teamAssignment ? 'asignado' : 'falló'}`);

        res.json({
            success: true,
            message: `Invitación enviada exitosamente a ${username}`,
            user: {
                username: githubUser.login,
                name: githubUser.name,
                avatar: githubUser.avatar_url
            },
            teamAssigned: teamAssignment
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error enviando invitación para ${username} desde IP: ${userIP} (${processingTime}ms):`, error.message);

        auditLog('INVITE_ERROR', username || 'unknown', userIP, false, `Error: ${error.message}`);

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Endpoint para verificar usuario (para el preview)
app.get('/api/user/:username', userVerificationLimiter, async (req, res) => {
    try {
        const { username } = req.params;

        // Validar formato básico
        if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
            return res.status(400).json({
                error: 'Formato de username inválido'
            });
        }

        const { data } = await octokit.rest.users.getByUsername({ username });

        // Filtrar solo la información necesaria para el preview
        res.json({
            login: data.login,
            name: data.name,
            avatar_url: data.avatar_url,
            bio: data.bio,
            location: data.location,
            public_repos: data.public_repos,
            followers: data.followers,
            created_at: data.created_at
        });

    } catch (error) {
        if (error.status === 404) {
            res.status(404).json({
                error: 'Usuario no encontrado'
            });
        } else {
            console.error('Error verificando usuario:', error.message);
            res.status(500).json({
                error: 'Error del servidor'
            });
        }
    }
});

// =====================================
// SISTEMA DE PROMOCIÓN AUTOMÁTICA
// =====================================

// Webhook para eventos de GitHub
app.post('/webhook/github', async (req, res) => {
    try {
        const event = req.headers['x-github-event'];
        const delivery = req.headers['x-github-delivery'];
        const signature = req.headers['x-hub-signature-256'];

        // Verificar webhook signature (recomendado en producción)
        if (process.env.GITHUB_WEBHOOK_SECRET) {
            const crypto = require('crypto');
            const expectedSignature = 'sha256=' + crypto
                .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
                .update(req.body)
                .digest('hex');

            if (signature !== expectedSignature) {
                console.log('❌ Webhook signature inválida');
                return res.status(401).send('Unauthorized');
            }
        }

        const payload = JSON.parse(req.body.toString());

        console.log(`📡 Webhook recibido: ${event} | Delivery: ${delivery}`);

        // Solo procesar eventos relevantes para promoción
        if (['repository', 'push', 'pull_request', 'issues'].includes(event)) {
            await handlePromotionEvent(event, payload);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error procesando webhook:', error.message);
        res.status(500).send('Error');
    }
});

async function handlePromotionEvent(event, payload) {
    try {
        let username = null;
        let shouldPromote = false;
        let reason = '';

        switch (event) {
        case 'repository':
            // Usuario creó un nuevo repositorio en la organización
            if (payload.action === 'created' && payload.repository.owner.login === GITHUB_ORG) {
                username = payload.sender.login;
                shouldPromote = true;
                reason = 'Creó repositorio';
            }
            break;

        case 'push':
            // Usuario hizo push a un repositorio
            if (payload.commits && payload.commits.length > 0 && payload.repository.owner.login === GITHUB_ORG) {
                username = payload.pusher.name || payload.sender.login;
                shouldPromote = true;
                reason = `Push con ${payload.commits.length} commits`;
            }
            break;

        case 'pull_request':
            // Usuario abrió un PR
            if (payload.action === 'opened' && payload.repository.owner.login === GITHUB_ORG) {
                username = payload.pull_request.user.login;
                shouldPromote = true;
                reason = 'Abrió Pull Request';
            }
            break;

        case 'issues':
            // Usuario creó un issue
            if (payload.action === 'opened' && payload.repository.owner.login === GITHUB_ORG) {
                username = payload.issue.user.login;
                shouldPromote = true;
                reason = 'Creó Issue';
            }
            break;
        }

        if (shouldPromote && username) {
            console.log(`🚀 Evaluando promoción para ${username}: ${reason}`);
            await promoteUserToCollaborator(username, reason);
        }
    } catch (error) {
        console.error('Error en handlePromotionEvent:', error.message);
    }
}

async function promoteUserToCollaborator(username, reason) {
    try {
        // Verificar si ya está en el equipo de colaboradores
        try {
            await octokit.rest.teams.getMembershipForUserInOrg({
                org: GITHUB_ORG,
                team_slug: COLLABORATORS_TEAM,
                username
            });
            console.log(`ℹ️  ${username} ya es colaborador`);
            return; // Ya es colaborador
        } catch (error) {
            if (error.status !== 404) {
                throw error;
            }
            // 404 significa que no es colaborador, proceder
        }

        // Verificar si es miembro de la organización
        try {
            await octokit.rest.orgs.getMembershipForUser({
                org: GITHUB_ORG,
                username
            });
        } catch (error) {
            if (error.status === 404) {
                console.log(`⚠️  ${username} no es miembro de la organización`);
                return;
            }
            throw error;
        }

        // Promover a colaborador
        await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
            org: GITHUB_ORG,
            team_slug: COLLABORATORS_TEAM,
            username: username,
            role: 'member'
        });

        console.log(`✅ ${username} promovido a Colaborador (${reason})`);

        // Enviar mensaje de felicitación
        await sendCongratulationsMessage(username, reason);

    } catch (error) {
        console.error(`❌ Error promoviendo a ${username}:`, error.message);
    }
}

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

// =====================================
// ENDPOINTS ADICIONALES
// =====================================

// Endpoint para servir configuración pública al frontend
app.get('/api/config', (req, res) => {
    res.json({
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
        githubOrg: GITHUB_ORG,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Estado del bot
app.get('/api/bot/status', (req, res) => {
    res.json({
        status: 'active',
        organization: GITHUB_ORG,
        teams: {
            community: COMMUNITY_TEAM,
            collaborators: COLLABORATORS_TEAM
        },
        security: {
            rateLimiting: 'enabled',
            recaptcha: RECAPTCHA_SECRET ? 'enabled' : 'disabled',
            webhookSecret: process.env.GITHUB_WEBHOOK_SECRET ? 'configured' : 'not configured'
        },
        features: [
            'Auto invitation to Community team',
            'Auto promotion to Collaborators team',
            'Webhook event processing',
            'Rate limiting protection',
            'reCAPTCHA verification',
            'User preview functionality',
            'Audit logging'
        ],
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Promoción manual para administradores
app.post('/api/admin/promote/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { adminKey, reason } = req.body;
        const adminIP = req.ip;

        if (adminKey !== process.env.ADMIN_KEY) {
            auditLog('ADMIN_PROMOTE', username, adminIP, false, 'Clave de admin inválida');
            return res.status(401).json({
                success: false,
                message: 'No autorizado'
            });
        }

        await promoteUserToCollaborator(username, reason || 'Promoción manual por admin');

        auditLog('ADMIN_PROMOTE', username, adminIP, true, 'Promoción manual exitosa');

        res.json({
            success: true,
            message: `Usuario ${username} promovido manualmente a Colaborador`
        });
    } catch (error) {
        console.error('Error en promoción manual:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Estadísticas básicas (sin información sensible)
app.get('/api/stats', async (req, res) => {
    try {
        // Obtener estadísticas básicas de la organización
        const { data: org } = await octokit.rest.orgs.get({ org: GITHUB_ORG });

        res.json({
            organization: {
                name: org.name,
                description: org.description,
                public_repos: org.public_repos,
                followers: org.followers,
                created_at: org.created_at
            },
            bot: {
                uptime: process.uptime(),
                status: 'active'
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
        res.status(500).json({
            error: 'Error obteniendo estadísticas'
        });
    }
});


// =====================================
// MIDDLEWARE DE MANEJO DE ERRORES
// =====================================

// Error handler middleware - DEBE tener 4 parámetros
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    
    // Error de parsing JSON
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Formato JSON inválido'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// =====================================
// INICIALIZACIÓN DEL SERVIDOR
// =====================================

const PORT = process.env.PORT || 3000;

// Solo iniciar servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        const isDev = process.env.NODE_ENV === 'development';
        console.log(`
🚀 Servidor MeshChile ejecutándose en puerto ${PORT}
📡 Bot de promoción automática: ACTIVO
🛡️  Rate limiting: ${isDev ? 'RELAJADO (DEV)' : 'ACTIVO (PROD)'}
🤖 reCAPTCHA: ${RECAPTCHA_SECRET ? 'ACTIVO' : 'DESACTIVADO'}
🔐 Webhook signature: ${process.env.GITHUB_WEBHOOK_SECRET ? 'CONFIGURADO' : 'NO CONFIGURADO'}
🏢 Organización: ${GITHUB_ORG}
👥 Equipo Comunidad: ${COMMUNITY_TEAM}
⭐ Equipo Colaboradores: ${COLLABORATORS_TEAM}
🌍 Entorno: ${process.env.NODE_ENV || 'development'}
${isDev ? '⚠️  MODO DESARROLLO: Rate limits relajados (100 invites/min)' : ''}
    `);
    });
}

// Exportar para testing
module.exports = app;

// Manejo de señales para cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor gracefulmente...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Señal SIGTERM recibida, cerrando servidor...');
    process.exit(0);
});

