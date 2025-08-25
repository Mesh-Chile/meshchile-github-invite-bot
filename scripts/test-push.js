#!/usr/bin/env node

/**
 * Simula un evento de push en GitHub
 * Esto debería disparar la promoción automática del usuario
 */

const WebhookUtils = require('./webhook-utils');

async function testPushEvent(username, commitCount = 3, repoName = null) {
    console.log(`🚀 Simulando push para: ${username}`);

    const webhookUtils = new WebhookUtils();
    const repository = repoName || `${username}-project`;

    // Generar commits simulados
    const commits = [];
    for (let i = 0; i < commitCount; i++) {
        commits.push({
            id: `abc123${i}${Math.floor(Math.random() * 1000)}`,
            message: `feat: awesome feature ${i + 1} by ${username}`,
            timestamp: new Date(Date.now() - (commitCount - i) * 60000).toISOString(),
            url: `https://github.com/Mesh-Chile/${repository}/commit/abc123${i}`,
            author: {
                name: username,
                email: `${username}@example.com`,
                username: username
            },
            committer: {
                name: username,
                email: `${username}@example.com`,
                username: username
            },
            added: [`src/feature${i + 1}.js`],
            removed: [],
            modified: ['README.md']
        });
    }

    const payload = {
        ref: 'refs/heads/main',
        before: '0000000000000000000000000000000000000000',
        after: commits[commits.length - 1].id,
        created: false,
        deleted: false,
        forced: false,
        base_ref: null,
        compare: `https://github.com/Mesh-Chile/${repository}/compare/main`,
        commits: commits,
        head_commit: commits[commits.length - 1],
        pusher: {
            name: username,
            email: `${username}@example.com`
        },
        ...webhookUtils.generateBasePayload(username, repository)
    };

    console.log(`📦 Repositorio: ${payload.repository.full_name}`);
    console.log(`👤 Usuario: ${username}`);
    console.log(`📝 Commits: ${commitCount}`);
    console.log(`🌿 Branch: main`);
    console.log('');

    const result = await webhookUtils.sendWebhook('push', payload);

    if (result.success) {
        console.log(`
✅ Evento de push enviado exitosamente!

🎉 Si todo funciona correctamente, ${username} debería ser promovido a Colaborador
📊 Push simulado con ${commitCount} commits
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
    const commitCount = parseInt(process.argv[3]) || 3;
    const repoName = process.argv[4];

    if (!username) {
        console.log(`
🔧 Test de Evento de Push - MeshChile GitHub Bot

💡 Uso:
  node scripts/test-push.js <username> [commit-count] [repo-name]

📝 Ejemplos:
  node scripts/test-push.js octocat
  node scripts/test-push.js octocat 5
  node scripts/test-push.js octocat 2 awesome-project

📋 Descripción:
  Simula que un usuario hizo push con commits a un repositorio.
  Esto debería disparar la promoción automática a Colaborador.

⚡ Evento GitHub simulado: push
        `);
        process.exit(1);
    }

    testPushEvent(username, commitCount, repoName)
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error ejecutando test:', error.message);
            process.exit(1);
        });
}

module.exports = testPushEvent;