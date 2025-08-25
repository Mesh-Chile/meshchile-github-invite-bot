#!/usr/bin/env node
/**
 * Ejecuta todos los tipos de eventos de webhook para un usuario
 * Útil para probar todos los disparadores de promoción de una vez
 */
const testRepository = require('./test-repository');
const testPush = require('./test-push');
const testPullRequest = require('./test-pull-request');
const testIssues = require('./test-issues');

async function testAllEvents(username, delay = 2000) {
    console.log(`🚀 Ejecutando TODOS los eventos de webhook para: ${username}`);
    console.log(`⏱️  Delay entre eventos: ${delay}ms`);
    console.log('');

    const results = [];
    const events = [
        { name: 'Repository Creation', fn: testRepository, args: [username] },
        { name: 'Push Event', fn: testPush, args: [username, 2] },
        { name: 'Pull Request', fn: testPullRequest, args: [username] },
        { name: 'Issues Creation', fn: testIssues, args: [username] }
    ];

    for (let i = 0; i < events.length; i++) {
        const event = events[i];

        console.log(`\n📡 [${i + 1}/${events.length}] Ejecutando: ${event.name}`);
        console.log('═'.repeat(50));

        try {
            const result = await event.fn(...event.args);
            results.push({
                event: event.name,
                success: result.success,
                delivery: result.delivery,
                error: result.error
            });

            if (result.success) {
                console.log(`✅ ${event.name} - Exitoso`);
            } else {
                console.log(`❌ ${event.name} - Falló: ${result.error}`);
            }

            // Delay entre eventos para no saturar el servidor
            if (i < events.length - 1) {
                console.log(`⏳ Esperando ${delay}ms antes del siguiente evento...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

        } catch (error) {
            console.error(`❌ Error ejecutando ${event.name}:`, error.message);
            results.push({
                event: event.name,
                success: false,
                error: error.message
            });
        }
    }

    // Resumen final
    console.log('\n');
    console.log('🎯 RESUMEN DE EJECUCIÓN');
    console.log('═'.repeat(50));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Exitosos: ${successful}/${results.length}`);
    console.log(`❌ Fallidos: ${failed}/${results.length}`);

    if (failed > 0) {
        console.log('\n❌ Eventos fallidos:');
        results
            .filter(r => !r.success)
            .forEach(r => console.log(`  • ${r.event}: ${r.error}`));
    }

    if (successful > 0) {
        console.log(`
🎉 ¡${successful} eventos enviados exitosamente!

Si el sistema de promoción funciona correctamente:
📈 ${username} debería ser promovido a Colaborador automáticamente
📧 Se debería crear un issue de felicitación en el repo 'bienvenidos'
👥 Verifica la membresía del usuario en el equipo 'colaboradores'

💡 Tip: Revisa los logs del servidor para ver el procesamiento de cada evento
        `);
    }

    return {
        total: results.length,
        successful,
        failed,
        results
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const username = process.argv[2];
    const delay = parseInt(process.argv[3]) || 2000;

    if (!username) {
        console.log(`
🔧 Test de TODOS los Eventos - MeshChile GitHub Bot

💡 Uso:
  node scripts/test-all-events.js <username> [delay-ms]

📝 Ejemplos:
  node scripts/test-all-events.js octocat
  node scripts/test-all-events.js octocat 3000

📋 Descripción:
  Ejecuta todos los tipos de eventos de webhook en secuencia:
  1. Repository creation
  2. Push event
  3. Pull request opening
  4. Issues creation

  Cada uno de estos eventos debería disparar la promoción automática.

⏱️  Delay por defecto: 2000ms entre eventos
        `);
        process.exit(1);
    }

    testAllEvents(username, delay)
        .then(summary => {
            console.log(`\n📊 Resumen final: ${summary.successful}/${summary.total} exitosos`);
            process.exit(summary.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('❌ Error ejecutando test completo:', error.message);
            process.exit(1);
        });
}

module.exports = testAllEvents;
