#!/usr/bin/env node

/**
 * Simula un evento de creación de Issue en GitHub
 * Esto debería disparar la promoción automática del usuario
 */

const WebhookUtils = require('./webhook-utils');

async function testIssuesEvent(username, issueTitle = null, repoName = null) {
    console.log(`🚀 Simulando creación de Issue para: ${username}`);

    const webhookUtils = new WebhookUtils();
    const repository = repoName || `${username}-project`;
    const title = issueTitle || `🐛 Bug report from ${username}`;

    const payload = {
        action: 'opened',
        issue: {
            id: Math.floor(Math.random() * 1000000),
            number: Math.floor(Math.random() * 1000) + 1,
            state: 'open',
            title: title,
            body: `## Descripción del problema
            
He encontrado un bug importante que necesita ser arreglado.

## Pasos para reproducir

1. Ir a la página principal
2. Hacer click en el botón X
3. Observar el error

## Comportamiento esperado

Debería funcionar correctamente.

## Comportamiento actual

Se produce un error.

## Información adicional

- Navegador: Chrome 120
- OS: ${['Windows 11', 'macOS Sonoma', 'Ubuntu 22.04'][Math.floor(Math.random() * 3)]}
- Versión: 1.0.0

---

Reportado por @${username}`,
            user: {
                login: username,
                id: Math.floor(Math.random() * 1000000),
                avatar_url: `https://github.com/${username}.png`,
                type: 'User'
            },
            labels: [
                {
                    id: Math.floor(Math.random() * 1000),
                    name: 'bug',
                    color: 'd73a4a'
                },
                {
                    id: Math.floor(Math.random() * 1000),
                    name: 'needs-investigation',
                    color: 'fbca04'
                }
            ],
            assignees: [],
            milestone: null,
            comments: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            html_url: `https://github.com/Mesh-Chile/${repository}/issues/${Math.floor(Math.random() * 1000) + 1}`,
            author_association: 'MEMBER'
        },
        ...webhookUtils.generateBasePayload(username, repository)
    };

    console.log(`📦 Repositorio: ${payload.repository.full_name}`);
    console.log(`👤 Usuario: ${username}`);
    console.log(`🐛 Issue: ${title}`);
    console.log(`🏷️  Labels: ${payload.issue.labels.map(l => l.name).join(', ')}`);
    console.log('');

    const result = await webhookUtils.sendWebhook('issues', payload);

    if (result.success) {
        console.log(`
✅ Evento de Issue enviado exitosamente!

🎉 Si todo funciona correctamente, ${username} debería ser promovido a Colaborador
🐛 Issue simulado: "${title}"
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
    const issueTitle = process.argv[3];
    const repoName = process.argv[4];

    if (!username) {
        console.log(`
🔧 Test de Evento de Issues - MeshChile GitHub Bot

💡 Uso:
  node scripts/test-issues.js <username> [issue-title] [repo-name]

📝 Ejemplos:
  node scripts/test-issues.js octocat
  node scripts/test-issues.js octocat "Critical bug found"
  node scripts/test-issues.js octocat "Feature request" awesome-project

📋 Descripción:
  Simula que un usuario creó un nuevo Issue en un repositorio.
  Esto debería disparar la promoción automática a Colaborador.

⚡ Evento GitHub simulado: issues.opened
        `);
        process.exit(1);
    }

    testIssuesEvent(username, issueTitle, repoName)
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Error ejecutando test:', error.message);
            process.exit(1);
        });
}

module.exports = testIssuesEvent;