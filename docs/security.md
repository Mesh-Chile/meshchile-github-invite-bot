# 🔒 Seguridad - MeshChile GitHub Bot

Guía completa de seguridad, mejores prácticas y consideraciones para el sistema de invitaciones y promoción automática.

## 🛡️ Modelo de Seguridad

### Principios de Seguridad

**Defense in Depth:**
- 🔐 **Autenticación** múltiple (GitHub Token + reCAPTCHA + Webhook signatures)
- 🚧 **Rate limiting** agresivo por IP y endpoint
- ✅ **Validación** estricta de todos los inputs
- 🔍 **Audit logging** completo de todas las acciones
- 🚫 **Principio de menor privilegio** en tokens y permisos

**Seguridad por Capas:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Internet/Atacantes                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Layer 1: Network (Cloudflare/WAF/DDoS Protection)         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Layer 2: Rate Limiting (Express Rate Limit)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Layer 3: Input Validation (Schema + Regex)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Layer 4: reCAPTCHA v3 (Bot Detection)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  Layer 5: GitHub API (Token Scopes + Organization Perms)   │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Autenticación y Autorización

### GitHub Token Security

**Scopes Mínimos Requeridos:**
```yaml
repo:
  - issues:write     # Solo para crear issues felicitación
  - metadata:read    # Leer info básica repositorios

write:org:
  - members:write    # Gestionar membresías
  - teams:write      # Gestionar equipos

admin:org_hook:
  - hooks:read       # Verificar webhooks
```

**Rotación de Token:**
```bash
# Cada 3-6 meses
# 1. Crear nuevo token con mismos scopes
# 2. Actualizar en variables de entorno
# 3. Probar funcionamiento
# 4. Revocar token anterior
```

**Almacenamiento Seguro:**
```bash
# NUNCA en código fuente
# ✅ Variables de entorno
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# ✅ Secrets management (Railway, Heroku, etc.)
# ✅ Vault/HashiCorp para enterprise
# ❌ NUNCA en .env commiteado
# ❌ NUNCA en logs
```

### Webhook Signature Verification

**HMAC SHA-256 Verification:**
```javascript
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret) {
    console.warn('⚠️ Webhook sin secret - solo para desarrollo');
    return true;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  // Comparación segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );
}
```

**Configuración Segura:**
```bash
# Generar secret fuerte
openssl rand -hex 32

# Configurar en GitHub webhook
Secret: abc123def456...

# Configurar en aplicación
GITHUB_WEBHOOK_SECRET=abc123def456...
```

### Admin Key Security

**Generación Segura:**
```bash
# Generar clave administrativa fuerte
openssl rand -base64 32

# Ejemplo de salida
ADMIN_KEY=Kj8/4mF9sPqR2tY6w9zB3vN8xC1eH5jL
```

**Uso Seguro:**
```javascript
// Verificación constante-time
function verifyAdminKey(providedKey, storedKey) {
  if (!providedKey || !storedKey) return false;
  
  return crypto.timingSafeEqual(
    Buffer.from(providedKey, 'utf8'),
    Buffer.from(storedKey, 'utf8')
  );
}
```

## 🚧 Rate Limiting y DDoS Protection

### Rate Limiting Strategy

**Multi-tier Rate Limiting:**
```javascript
// Tier 1: Invitaciones (más restrictivo)
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 3,                    // 3 requests por IP
  message: 'Demasiadas solicitudes. Intenta en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Whitelist para IPs confiables (opcional)
    const trustedIPs = ['192.168.1.100', '10.0.0.50'];
    return trustedIPs.includes(req.ip);
  }
});

// Tier 2: General (moderado)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minuto
  max: 20,                   // 20 requests por IP
  message: 'Rate limit exceeded. Please try again later.'
});

// Tier 3: User verification (permisivo)
const userLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minuto
  max: 10,                   // 10 requests por IP
});
```

**Configuración por Entorno:**
```javascript
const getRateLimits = () => {
  switch (process.env.NODE_ENV) {
    case 'test':
      return { max: 1000, windowMs: 1000 };
    case 'development':
      return { max: 100, windowMs: 60000 };
    case 'production':
      return { max: 3, windowMs: 900000 };
    default:
      return { max: 10, windowMs: 60000 };
  }
};
```

### DDoS Protection

**Application Level:**
- ✅ Rate limiting por IP
- ✅ Request size limits (10MB)
- ✅ Timeout de requests (30s)
- ✅ Connection limits

**Infrastructure Level:**
```yaml
Cloudflare:
  - DDoS protection automático
  - WAF rules personalizadas
  - Rate limiting por país/ASN
  - Bot fight mode

Nginx (si aplica):
  - limit_req_zone
  - limit_conn_zone
  - Slow request protection
```

## 🛡️ Input Validation y Sanitization

### Username Validation

**Regex Validation:**
```javascript
const USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    throw new Error('Username must be a string');
  }
  
  if (username.length > 39) {
    throw new Error('Username too long');
  }
  
  if (!USERNAME_REGEX.test(username)) {
    throw new Error('Invalid username format');
  }
  
  return username.toLowerCase();
}
```

**Sanitización adicional:**
```javascript
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()                    // Remover espacios
    .slice(0, 100)            // Limitar longitud
    .replace(/[<>]/g, '');    // Remover caracteres peligrosos
}
```

### JSON Schema Validation

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

const inviteSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      pattern: '^[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}$',
      minLength: 1,
      maxLength: 39
    },
    recaptchaToken: {
      type: 'string',
      minLength: 20,
      maxLength: 1000
    }
  },
  required: ['username'],
  additionalProperties: false
};

const validate = ajv.compile(inviteSchema);

function validateInviteRequest(data) {
  const valid = validate(data);
  if (!valid) {
    throw new Error(`Validation error: ${JSON.stringify(validate.errors)}`);
  }
  return data;
}
```

## 🤖 Bot Protection (reCAPTCHA v3)

### Configuración Segura

**Score Threshold:**
```javascript
const RECAPTCHA_CONFIG = {
  siteKey: process.env.RECAPTCHA_SITE_KEY,
  secretKey: process.env.RECAPTCHA_SECRET_KEY,
  minScore: 0.5,              // Ajustar según false positives
  expectedAction: 'github_invite',
  timeout: 5000               // 5 segundos timeout
};
```

**Verificación Robusta:**
```javascript
async function verifyRecaptchaV3(token, userIP) {
  if (!RECAPTCHA_CONFIG.secretKey) {
    console.warn('⚠️ reCAPTCHA not configured');
    return { success: true, score: 1.0 }; // Solo en desarrollo
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_CONFIG.secretKey,
          response: token,
          remoteip: userIP
        },
        timeout: RECAPTCHA_CONFIG.timeout
      }
    );

    const { success, score, action, 'error-codes': errorCodes } = response.data;

    // Verificaciones de seguridad
    if (!success) {
      console.log(`❌ reCAPTCHA failed: ${errorCodes?.join(', ')}`);
      return { success: false, reason: 'verification_failed' };
    }

    if (score < RECAPTCHA_CONFIG.minScore) {
      console.log(`❌ reCAPTCHA score too low: ${score}`);
      return { success: false, reason: 'low_score', score };
    }

    if (action !== RECAPTCHA_CONFIG.expectedAction) {
      console.log(`❌ reCAPTCHA wrong action: ${action}`);
      return { success: false, reason: 'wrong_action' };
    }

    console.log(`✅ reCAPTCHA success: score=${score}, action=${action}`);
    return { success: true, score, action };

  } catch (error) {
    console.error('❌ reCAPTCHA error:', error.message);
    return { success: false, reason: 'network_error' };
  }
}
```

## 📊 Audit Logging y Monitoring

### Audit Trail

**Eventos Críticos a Loggear:**
```javascript
const AUDIT_EVENTS = {
  INVITE_ATTEMPT: 'User invitation attempt',
  INVITE_SUCCESS: 'User invitation successful',
  INVITE_FAILED: 'User invitation failed',
  PROMOTION_AUTO: 'Automatic user promotion',
  PROMOTION_MANUAL: 'Manual user promotion',
  ADMIN_ACCESS: 'Admin endpoint accessed',
  WEBHOOK_RECEIVED: 'GitHub webhook received',
  RATE_LIMIT_HIT: 'Rate limit exceeded',
  SECURITY_VIOLATION: 'Security rule violated'
};

function auditLog(event, username, ip, success, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    username: username || 'unknown',
    ip: ip || 'unknown',
    success: Boolean(success),
    details,
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version || 'unknown'
  };

  // Log a archivo y consola
  console.log(`[AUDIT] ${JSON.stringify(logEntry)}`);
  
  // En producción, enviar a servicio de logging
  if (process.env.NODE_ENV === 'production') {
    // sendToLogService(logEntry);
  }
}
```

### Security Monitoring

**Alertas Automáticas:**
```javascript
function checkSecurityThresholds() {
  const alerts = [];
  
  // Rate limit hits excesivos
  const rateLimitHits = getRateLimitHits(Date.now() - 3600000); // 1 hora
  if (rateLimitHits > 100) {
    alerts.push({
      type: 'RATE_LIMIT_ABUSE',
      message: `${rateLimitHits} rate limit hits in last hour`,
      severity: 'HIGH'
    });
  }
  
  // Fallos de reCAPTCHA excesivos
  const recaptchaFails = getRecaptchaFails(Date.now() - 3600000);
  if (recaptchaFails > 50) {
    alerts.push({
      type: 'RECAPTCHA_ABUSE',
      message: `${recaptchaFails} reCAPTCHA failures in last hour`,
      severity: 'MEDIUM'
    });
  }
  
  // Errores de autenticación
  const authErrors = getAuthErrors(Date.now() - 3600000);
  if (authErrors > 20) {
    alerts.push({
      type: 'AUTH_FAILURES',
      message: `${authErrors} authentication failures in last hour`,
      severity: 'HIGH'
    });
  }
  
  return alerts;
}
```

## 🔍 Vulnerability Management

### Dependency Security

**Automated Scanning:**
```bash
# npm audit automático
npm audit --audit-level high

# GitHub Dependabot
# Configurado automáticamente en .github/dependabot.yml

# Snyk scanning (opcional)
npm install -g snyk
snyk test
snyk monitor
```

**Regular Updates:**
```bash
# Actualizar dependencias regularmente
npm update

# Verificar vulnerabilidades
npm audit fix

# Para vulnerabilidades críticas
npm audit fix --force
```

### Security Headers

**Express Security Headers:**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.github.com"],
      frameSrc: ["https://www.google.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 🚨 Incident Response

### Security Incident Types

**Clasificación de Incidentes:**
```yaml
CRITICAL (P0):
  - Compromiso de GitHub Token
  - Acceso no autorizado a admin
  - Data breach/leak

HIGH (P1):
  - DDoS attack exitoso
  - Rate limiting bypasseado
  - Webhook spoofing

MEDIUM (P2):
  - reCAPTCHA bypass attempts
  - Excessive failed logins
  - Suspicious user patterns

LOW (P3):
  - Normal rate limiting hits
  - Failed webhook deliveries
  - Configuration warnings
```

### Response Procedures

**P0 - Critical Incident:**
```bash
# 1. Immediate containment (5 minutos)
# Revocar GitHub token comprometido
# Cambiar admin keys
# Parar aplicación si es necesario

# 2. Assessment (15 minutos)
# Revisar logs de audit
# Identificar scope del compromiso
# Notificar a stakeholders

# 3. Recovery (60 minutos)
# Generar nuevos tokens/keys
# Deploy con fix de seguridad
# Verificar integridad del sistema

# 4. Post-incident (24 horas)
# Post-mortem report
# Actualizar procedures
# Implementar preventive measures
```

**Contact Tree:**
```yaml
Primary: security@meshchile.cl
Escalation:
  - DevOps Lead: devops@meshchile.cl
  - CTO: cto@meshchile.cl
  - External: security-consultant@example.com
```

## 🔐 Best Practices

### Development Security

**Secure Coding:**
- ✅ Never log sensitive data (tokens, passwords)
- ✅ Use parameterized queries (aunque no usamos DB)
- ✅ Validate all inputs on server side
- ✅ Use HTTPS in production always
- ✅ Implement proper error handling
- ❌ Never commit secrets to git
- ❌ Never use eval() or similar
- ❌ Don't trust client-side validation only

**Code Review Checklist:**
```markdown
Security Review Checklist:
- [ ] No hardcoded secrets or tokens
- [ ] Input validation implemented
- [ ] Rate limiting appropriate
- [ ] Error messages don't leak info
- [ ] Audit logging in place
- [ ] Dependencies updated
- [ ] Tests cover security scenarios
```

### Production Security

**Infrastructure:**
- 🔒 Use HTTPS/TLS 1.3 everywhere
- 🛡️ Enable WAF (Web Application Firewall)
- 🚫 Disable unnecessary services/ports
- 👤 Use principle of least privilege
- 📊 Monitor everything
- 💾 Encrypt data at rest and in transit
- 🔄 Regular security updates
- 🔑 Strong authentication everywhere

**Monitoring:**
```bash
# Security monitoring checklist
- [ ] Failed authentication attempts
- [ ] Rate limit violations
- [ ] Unusual traffic patterns
- [ ] Error rate spikes
- [ ] GitHub API quota usage
- [ ] Certificate expiration
- [ ] Dependency vulnerabilities
```

## 📋 Security Checklist

### Pre-deployment Security

```markdown
□ GitHub token has minimal required scopes
□ Webhook secret configured and strong
□ Admin key is cryptographically secure
□ reCAPTCHA properly configured
□ Rate limiting tested and appropriate
□ Input validation comprehensive
□ HTTPS enforced in production
□ Security headers implemented
□ Dependencies scanned for vulnerabilities
□ Audit logging functional
□ Error handling doesn't leak information
□ Secrets not in code or logs
```

### Ongoing Security Maintenance

```markdown
Monthly:
□ Rotate GitHub token
□ Review audit logs
□ Update dependencies
□ Security scan with npm audit
□ Review rate limit effectiveness

Quarterly:
□ Rotate all secrets (webhook, admin)
□ Security assessment
□ Update incident response procedures
□ Review access controls
□ Penetration testing (if applicable)

Annually:
□ Full security audit
□ Review and update security policies
□ Staff security training
□ Third-party security assessment
```

---

**🔒 Seguridad implementada** ✅  
**🛡️ Defense in depth** ✅  
**📊 Monitoring activo** ✅  
**🚨 Incident response ready** ✅
