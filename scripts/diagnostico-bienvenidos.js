#!/usr/bin/env node
/**
 * Script de diagnóstico para el problema de creación de issues en bienvenidos
 */
const { Octokit } = require('@octokit/rest');
const path = require('path');

// Cargar .env desde el directorio padre
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function diagnosticoBienvenidos() {
    console.log('🔍 Diagnóstico del repositorio bienvenidos\n');

    const GITHUB_ORG = process.env.GITHUB_ORG || 'Mesh-Chile';
    const WELCOME_REPO = process.env.WELCOME_REPO || 'bienvenidos';

    if (!process.env.GITHUB_TOKEN) {
        console.error('❌ GITHUB_TOKEN no está configurado en .env');
        return;
    }

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    });

    console.log(`📋 Configuración:`);
    console.log(`   • Organización: ${GITHUB_ORG}`);
    console.log(`   • Repositorio: ${WELCOME_REPO}`);
    console.log(`   • Token: ${process.env.GITHUB_TOKEN ? '✅ Configurado' : '❌ No configurado'}`);
    console.log('');

    try {
        // 1. Verificar acceso al repositorio
        console.log('📦 1. Verificando acceso al repositorio...');
        const { data: repo } = await octokit.rest.repos.get({
            owner: GITHUB_ORG,
            repo: WELCOME_REPO
        });
        console.log(`   ✅ Repositorio existe: ${repo.full_name}`);
        console.log(`   • Privado: ${repo.private ? 'Sí' : 'No'}`);
        console.log(`   • Issues habilitados: ${repo.has_issues ? 'Sí' : 'No'}`);
        console.log(`   • Permisos: ${repo.permissions ? JSON.stringify(repo.permissions) : 'No disponibles'}`);

        // 2. Verificar permisos específicos para issues
        console.log('\n🔐 2. Verificando permisos para crear issues...');
        try {
            // Intentar listar issues existentes (permiso de lectura)
            const { data: issues } = await octokit.rest.issues.listForRepo({
                owner: GITHUB_ORG,
                repo: WELCOME_REPO,
                per_page: 1
            });
            console.log(`   ✅ Puede leer issues (${issues.length} issues encontrados)`);
        } catch (error) {
            console.log(`   ❌ No puede leer issues: ${error.message}`);
        }

        // 3. Verificar si el token es de una app o un PAT
        console.log('\n🤖 3. Verificando tipo de autenticación...');
        const { data: auth } = await octokit.rest.users.getAuthenticated();
        console.log(`   • Usuario/App: ${auth.login}`);
        console.log(`   • Tipo: ${auth.type}`);
        console.log(`   • ID: ${auth.id}`);

        // 4. Verificar membresía en la organización
        console.log('\n👥 4. Verificando membresía en la organización...');
        try {
            const { data: membership } = await octokit.rest.orgs.getMembershipForAuthenticatedUser({
                org: GITHUB_ORG
            });
            console.log(`   ✅ Es miembro de ${GITHUB_ORG}`);
            console.log(`   • Role: ${membership.role}`);
            console.log(`   • Estado: ${membership.state}`);
        } catch (error) {
            console.log(`   ❌ No es miembro de ${GITHUB_ORG}: ${error.message}`);
        }

        // 5. Verificar permisos específicos del repositorio
        console.log('\n🔑 5. Verificando permisos del repositorio...');
        try {
            const { data: collaborator } = await octokit.rest.repos.getCollaboratorPermissionLevel({
                owner: GITHUB_ORG,
                repo: WELCOME_REPO,
                username: auth.login
            });
            console.log(`   ✅ Nivel de permisos: ${collaborator.permission}`);
            console.log(`   • Puede leer: ${collaborator.user.permissions?.pull || 'No disponible'}`);
            console.log(`   • Puede escribir: ${collaborator.user.permissions?.push || 'No disponible'}`);
            console.log(`   • Es admin: ${collaborator.user.permissions?.admin || 'No disponible'}`);
        } catch (error) {
            console.log(`   ❌ No se pudieron obtener permisos: ${error.message}`);
        }

        // 6. Intentar crear un issue de prueba
        console.log('\n✍️  6. Intentando crear issue de prueba...');
        try {
            const testIssue = await octokit.rest.issues.create({
                owner: GITHUB_ORG,
                repo: WELCOME_REPO,
                title: '🧪 Test de diagnóstico - Borrar este issue',
                body: 'Este es un issue de prueba creado por el script de diagnóstico.\n\n**Se puede borrar sin problemas.**',
                labels: ['test', 'diagnostico']
            });
            console.log(`   ✅ Issue creado exitosamente: #${testIssue.data.number}`);
            console.log(`   • URL: ${testIssue.data.html_url}`);

            // Intentar cerrarlo inmediatamente
            try {
                await octokit.rest.issues.update({
                    owner: GITHUB_ORG,
                    repo: WELCOME_REPO,
                    issue_number: testIssue.data.number,
                    state: 'closed'
                });
                console.log(`   ✅ Issue cerrado automáticamente`);
            } catch (closeError) {
                console.log(`   ⚠️  No se pudo cerrar el issue: ${closeError.message}`);
            }

        } catch (error) {
            console.log(`   ❌ Error creando issue: ${error.message}`);
            console.log(`   • Status: ${error.status}`);
            console.log(`   • Response: ${JSON.stringify(error.response?.data, null, 2)}`);
        }

        // 7. Verificar scopes del token
        console.log('\n🎯 7. Verificando scopes del token...');
        try {
            // Los scopes vienen en los headers de la respuesta
            const response = await octokit.request('GET /user');
            const scopes = response.headers['x-oauth-scopes'];
            console.log(`   • Scopes disponibles: ${scopes || 'No disponibles'}`);

            const requiredScopes = ['repo', 'write:org'];
            requiredScopes.forEach(scope => {
                if (scopes && scopes.includes(scope)) {
                    console.log(`   ✅ ${scope}: Disponible`);
                } else {
                    console.log(`   ❌ ${scope}: No disponible`);
                }
            });
        } catch (error) {
            console.log(`   ⚠️  No se pudieron verificar scopes: ${error.message}`);
        }

    } catch (error) {
        console.error(`❌ Error en diagnóstico: ${error.message}`);
        console.error(`Status: ${error.status}`);
        if (error.response?.data) {
            console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }

    console.log('\n📊 Resumen del diagnóstico completado');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    diagnosticoBienvenidos()
        .catch(error => {
            console.error('❌ Error ejecutando diagnóstico:', error.message);
            process.exit(1);
        });
}

module.exports = diagnosticoBienvenidos;
