#!/usr/bin/env node

/**
 * Simula un evento de creación de repositorio en GitHub
 * Esto debería disparar la promoción automática del usuario
 */

const WebhookUtils = require('./webhook-utils');

async function testRepositoryCreation(username, repoName = null) {
    console.log(`🚀 Simulando creación de repositorio para: ${username}`);

    const webhookUtils = new WebhookUtils();
    const repository = repoName || `${username}-awesome-project`;

    const payload = {
        action: 'created',
        ...webhookUtils.generateBasePayload(username, repository),
        repository: {
            ...webhookUtils.generateBasePayload(username, repository).repository,
            name: repository,
            full_name: `Mesh-Chile/${repository}`
        }
    };

    console.log(`📦 Repositorio: ${payload.repository.full_name}`);
    console.log(`👤 Usuario: ${username}`);
    console.log(`🎯 Acción: ${payload.action}`);
    console.log('');

    const result = await webhookUtils.sendWebhook('repository', payload);

    if (result.success) {
        console.log(`
✅ Evento de repositorio enviado exitosamente!

🎉 Si todo funciona correctamente, ${username} debería ser promovido a Colaborador
📧 Revisa si se creó un issue de felicitación en el repo 'bienvenidos'
👥 Verifica la membresía del usuario en el equipo 'colaboradores'
        `);
    } else {
        console.log(`❌ Error enviando el evento: ${result.error}`);
    }

    return result;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const username = process.argv[2];
    const repoName = process.argv[3];

    if (!username) {
        console.log(`
🔧 Test de Evento de Repositorio - MeshChile GitHub Bot

💡 Uso:
  node scripts/test-repository.js <username> [repo-name]

📝 Ejemplos:
  node scripts/test-repository.js octocat
  node scripts/test-repository.js octocat awesome-project

📋 Descripción:
  Simula que un usuario creó un nuevo repositorio en la organización.
  Esto debería disparar la promoción automática a Colaborador.

⚡ Evento GitHub simulado: repository.created
        `);
        process.exit(1);
    }

    testRepositoryCreation(username, repoName)
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error ejecutando test:', error.message);
            process.exit(1);
        });
}

module.exports = testRepositoryCreation;