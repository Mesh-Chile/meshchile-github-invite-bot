#!/usr/bin/env node

/**
 * Utilidades para generar firmas de webhook y payloads de GitHub
 */

const crypto = require('crypto');
const axios = require('axios');
const path = require('path');

// Cargar .env desde el directorio padre
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

class WebhookUtils {
    constructor(serverUrl = 'http://localhost:3000', webhookSecret = null) {
        this.serverUrl = serverUrl;
        this.webhookSecret = webhookSecret || process.env.GITHUB_WEBHOOK_SECRET;
    }

    /**
     * Genera una firma SHA256 para el payload del webhook
     */
    generateSignature(payload) {
        if (!this.webhookSecret) {
            console.warn('⚠️  GITHUB_WEBHOOK_SECRET no configurado, enviando sin firma');
            return null;
        }

        const hmac = crypto.createHmac('sha256', this.webhookSecret);
        hmac.update(payload, 'utf8');
        return 'sha256=' + hmac.digest('hex');
    }

    /**
     * Envía un webhook simulado al servidor
     */
    async sendWebhook(event, payload, deliveryId = null) {
        try {
            const payloadString = JSON.stringify(payload);
            const signature = this.generateSignature(payloadString);
            const delivery = deliveryId || crypto.randomUUID();

            const headers = {
                'Content-Type': 'application/json',
                'X-GitHub-Event': event,
                'X-GitHub-Delivery': delivery,
                'User-Agent': 'GitHub-Hookshot/webhook-test'
            };

            if (signature) {
                headers['X-Hub-Signature-256'] = signature;
            }

            console.log(`📡 Enviando webhook: ${event} | Delivery: ${delivery}`);
            console.log(`🎯 URL: ${this.serverUrl}/webhook/github`);

            const response = await axios.post(
                `${this.serverUrl}/webhook/github`,
                payloadString,
                { headers }
            );

            console.log(`✅ Webhook enviado exitosamente - Status: ${response.status}`);
            return { success: true, status: response.status, delivery };

        } catch (error) {
            console.error(`❌ Error enviando webhook:`, error.message);
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
                console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Genera payload base para eventos de GitHub
     */
    generateBasePayload(username, repoName = 'test-repo') {
        return {
            sender: {
                login: username,
                id: Math.floor(Math.random() * 1000000),
                avatar_url: `https://github.com/${username}.png`,
                type: 'User'
            },
            repository: {
                id: Math.floor(Math.random() * 1000000),
                name: repoName,
                full_name: `Mesh-Chile/${repoName}`,
                owner: {
                    login: 'Mesh-Chile',
                    id: 12345,
                    type: 'Organization'
                },
                private: false,
                html_url: `https://github.com/Mesh-Chile/${repoName}`,
                description: `Repositorio de prueba para ${username}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            organization: {
                login: 'Mesh-Chile',
                id: 12345,
                url: 'https://api.github.com/orgs/Mesh-Chile'
            }
        };
    }
}

module.exports = WebhookUtils;

// Si se ejecuta directamente, mostrar ayuda
if (require.main === module) {
    console.log(`
🔧 Utilidades de Webhook para MeshChile GitHub Bot

Esta es una librería de utilidades. Usa los scripts específicos:

📁 Scripts disponibles:
  • test-repository.js    - Simular creación de repositorio
  • test-push.js         - Simular push con commits  
  • test-pull-request.js - Simular apertura de PR
  • test-issues.js       - Simular creación de issue
  • test-all-events.js   - Probar todos los eventos

💡 Uso:
  node scripts/test-repository.js username
  node scripts/test-push.js username
  
📋 Variables de entorno requeridas:
  GITHUB_WEBHOOK_SECRET - Secret del webhook (opcional)
  GITHUB_ORG           - Nombre de la organización
    `);
}