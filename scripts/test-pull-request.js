#!/usr/bin/env node

/**
 * Simula un evento de apertura de Pull Request en GitHub
 * Esto debería disparar la promoción automática del usuario
 */

const WebhookUtils = require('./webhook-utils');

async function testPullRequestEvent(username, prTitle = null, repoName = null) {
    console.log(`🚀 Simulando apertura de Pull Request para: ${username}`);

    const webhookUtils = new WebhookUtils();
    const repository = repoName || `${username}-project`;
    const title = prTitle || `feat: awesome contribution by ${username}`;

    const payload = {
        action: 'opened',
        number: Math.floor(Math.random() * 1000) + 1,
        pull_request: {
            id: Math.floor(Math.random() * 1000000),
            number: Math.floor(Math.random() * 1000) + 1,
            state: 'open',
            title: title,
            body: `## Descripción\n\nEsta es una contribución genial de @${username}!\n\n## Cambios\n\n- ✨ Nuevo feature implementado\n- 🐛 Fixes varios\n- 📝 Documentación actualizada\n\n## Testing\n\n- [x] Tests unitarios\n- [x] Tests de integración\n- [x] Manual testing`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: `https://github.com/Mesh-Chile/${repository}/pull/${Math.floor(Math.random() * 1000) + 1}`,
            user: {
                login: username,
                id: Math.floor(Math.random() * 1000000),
                avatar_url: `https://github.com/${username}.png`,
                type: 'User'
            },
            head: {
                ref: `feature/${username}-awesome-feature`,
                sha: `abc123${Math.floor(Math.random() * 1000)}`,
                user: {
                    login: username,
                    id: Math.floor(Math.random() * 1000000)
                },
                repo: {
                    name: repository,
                    full_name: `${username}/${repository}`,
                    owner: {
                        login: username,
                        type: 'User'
                    }
                }
            },
            base: {
                ref: 'main',
                sha: `def456${Math.floor(Math.random() * 1000)}`,
                user: {
                    login: 'Mesh-Chile',
                    id: 12345
                },
                repo: {
                    name: repository,
                    full_name: `Mesh-Chile/${repository}`,
                    owner: {
                        login: 'Mesh-Chile',
                        type: 'Organization'
                    }
                }
            },
            mergeable: true,
            merged: false,
            additions: Math.floor(Math.random() * 100) + 10,
            deletions: Math.floor(Math.random() * 20) + 1,
            changed_files: Math.floor(Math.random() * 5) + 1
        },
        ...webhookUtils.generateBasePayload(username, repository)
    };

    console.log(`📦 Repositorio: ${payload.repository.full_name}`);
    console.log(`👤 Usuario: ${username}`);
    console.log(`📝 PR Title: ${title}`);
    console.log(`🌿 Branch: ${payload.pull_request.head.ref} → ${payload.pull_request.base.ref}`);
    console.log(`📊 Cambios: +${payload.pull_request.additions}/-${payload.pull_request.deletions}`);
    console.log('');

    const result = await webhookUtils.sendWebhook('pull_request', payload);

    if (result.success) {
        console.log(`
✅ Evento de Pull Request enviado exitosamente!

🎉 Si todo funciona correctamente, ${username} debería ser promovido a Colaborador
🔄 Pull Request simulado: "${title}"
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
    const prTitle = process.argv[3];
    const repoName = process.argv[4];

    if (!username) {
        console.log(`
🔧 Test de Evento de Pull Request - MeshChile GitHub Bot

💡 Uso:
  node scripts/test-pull-request.js <username> [pr-title] [repo-name]

📝 Ejemplos:
  node scripts/test-pull-request.js octocat
  node scripts/test-pull-request.js octocat "Fix important bug"
  node scripts/test-pull-request.js octocat "Add new feature" awesome-project

📋 Descripción:
  Simula que un usuario abrió un Pull Request en un repositorio.
  Esto debería disparar la promoción automática a Colaborador.

⚡ Evento GitHub simulado: pull_request.opened
        `);
        process.exit(1);
    }

    testPullRequestEvent(username, prTitle, repoName)
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error ejecutando test:', error.message);
            process.exit(1);
        });
}

module.exports = testPullRequestEvent;