const request = require('supertest');

// Mock Octokit
const mockOctokit = {
    rest: {
        users: {
            getByUsername: jest.fn()
        },
        orgs: {
            get: jest.fn(),
            getMembershipForUser: jest.fn(),
            createInvitation: jest.fn()
        },
        teams: {
            addOrUpdateMembershipForUserInOrg: jest.fn(),
            getMembershipForUserInOrg: jest.fn()
        },
        issues: {
            create: jest.fn()
        }
    }
};

jest.mock('@octokit/rest', () => ({
    Octokit: jest.fn(() => mockOctokit)
}));

// Mock axios for reCAPTCHA
const mockAxios = jest.fn();
jest.mock('axios', () => ({
    post: mockAxios
}));

const app = require('../server.js');

describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default successful reCAPTCHA response
        mockAxios.mockResolvedValue({
            data: {
                success: true,
                score: 0.9,
                action: 'github_invite'
            }
        });
    });

    describe('reCAPTCHA Validation', () => {
        beforeEach(() => {
            mockOctokit.rest.users.getByUsername.mockResolvedValue({
                data: {
                    id: 123,
                    login: 'testuser',
                    name: 'Test User',
                    avatar_url: 'https://avatar.url'
                }
            });

            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            mockOctokit.rest.orgs.getMembershipForUser.mockRejectedValue(notFoundError);

            mockOctokit.rest.orgs.createInvitation.mockResolvedValue({
                data: { id: 456 }
            });

            mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg.mockResolvedValue({
                data: { state: 'active' }
            });
        });

        it('should handle missing reCAPTCHA token', async () => {
            const response = await request(app)
                .post('/api/invite')
                .send({ username: 'testuser' })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'reCAPTCHA requerido'
            });
        });

        it('should handle reCAPTCHA verification failure', async () => {
            mockAxios.mockResolvedValue({
                data: {
                    success: false,
                    'error-codes': ['invalid-input-response']
                }
            });

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'invalid-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Verificación reCAPTCHA falló. Por favor intenta nuevamente.'
            });
        });

        it('should handle low reCAPTCHA score', async () => {
            mockAxios.mockResolvedValue({
                data: {
                    success: true,
                    score: 0.3, // Below threshold
                    action: 'github_invite'
                }
            });

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'low-score-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Verificación reCAPTCHA falló. Por favor intenta nuevamente.'
            });
        });

        it('should handle wrong reCAPTCHA action', async () => {
            mockAxios.mockResolvedValue({
                data: {
                    success: true,
                    score: 0.9,
                    action: 'wrong_action'
                }
            });

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'wrong-action-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Verificación reCAPTCHA falló. Por favor intenta nuevamente.'
            });
        });

        it('should handle reCAPTCHA network error', async () => {
            mockAxios.mockRejectedValue(new Error('Network error'));

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'network-error-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Verificación reCAPTCHA falló. Por favor intenta nuevamente.'
            });
        });

        it('should handle reCAPTCHA timeout', async () => {
            mockAxios.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'timeout-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Verificación reCAPTCHA falló. Por favor intenta nuevamente.'
            });
        });
    });

    describe('GitHub API Error Handling', () => {
        it('should handle non-404 GitHub API errors when checking membership', async () => {
            mockOctokit.rest.users.getByUsername.mockResolvedValue({
                data: { id: 123, login: 'testuser', name: 'Test User', avatar_url: 'https://avatar.url' }
            });

            const apiError = new Error('API Rate limit exceeded');
            apiError.status = 403;
            mockOctokit.rest.orgs.getMembershipForUser.mockRejectedValue(apiError);

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'valid-token'
                })
                .expect(500);

            expect(response.body).toEqual({
                success: false,
                message: 'Error interno del servidor'
            });
        });

        it('should handle GitHub API errors when checking user existence', async () => {
            const apiError = new Error('API Error');
            apiError.status = 500;
            mockOctokit.rest.users.getByUsername.mockRejectedValue(apiError);

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'valid-token'
                })
                .expect(500);

            expect(response.body).toEqual({
                success: false,
                message: 'Error interno del servidor'
            });
        });

        it('should handle invitation creation errors', async () => {
            mockOctokit.rest.users.getByUsername.mockResolvedValue({
                data: { id: 123, login: 'testuser', name: 'Test User', avatar_url: 'https://avatar.url' }
            });

            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            mockOctokit.rest.orgs.getMembershipForUser.mockRejectedValue(notFoundError);

            mockOctokit.rest.orgs.createInvitation.mockRejectedValue(new Error('Invitation failed'));

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'valid-token'
                })
                .expect(500);

            expect(response.body).toEqual({
                success: false,
                message: 'Error interno del servidor'
            });
        });
    });

    describe('Team Assignment Handling', () => {
        beforeEach(() => {
            mockOctokit.rest.users.getByUsername.mockResolvedValue({
                data: { id: 123, login: 'testuser', name: 'Test User', avatar_url: 'https://avatar.url' }
            });

            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            mockOctokit.rest.orgs.getMembershipForUser.mockRejectedValue(notFoundError);

            mockOctokit.rest.orgs.createInvitation.mockResolvedValue({
                data: { id: 456 }
            });
        });

        it('should handle team assignment failure gracefully', async () => {
            mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg.mockRejectedValue(
                new Error('Team assignment failed')
            );

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'valid-token'
                })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Invitación enviada exitosamente a testuser',
                teamAssigned: false
            });
        });

        it('should succeed with successful team assignment', async () => {
            mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg.mockResolvedValue({
                data: { state: 'active' }
            });

            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'testuser',
                    recaptchaToken: 'valid-token'
                })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Invitación enviada exitosamente a testuser',
                teamAssigned: true
            });
        });
    });

    describe('Input Validation', () => {
        it('should handle non-string username', async () => {
            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 123, // number instead of string
                    recaptchaToken: 'valid-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Nombre de usuario requerido'
            });
        });

        it('should handle empty string username', async () => {
            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: '', // empty string
                    recaptchaToken: 'valid-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Nombre de usuario requerido'
            });
        });

        it('should handle username with special characters', async () => {
            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'user@invalid!',
                    recaptchaToken: 'valid-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Formato de nombre de usuario inválido'
            });
        });

        it('should handle username that is too long', async () => {
            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'a'.repeat(40), // 40 characters, max is 39
                    recaptchaToken: 'valid-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Formato de nombre de usuario inválido'
            });
        });
    });

    describe('JSON Parsing Errors', () => {
        it('should handle malformed JSON', async () => {
            const response = await request(app)
                .post('/api/invite')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Formato JSON inválido'
            });
        });
    });

    describe('User Verification Endpoint Edge Cases', () => {
        it('should handle server errors when fetching user', async () => {
            const serverError = new Error('Internal Server Error');
            serverError.status = 500;
            mockOctokit.rest.users.getByUsername.mockRejectedValue(serverError);

            const response = await request(app)
                .get('/api/user/testuser')
                .expect(500);

            expect(response.body).toEqual({
                error: 'Error del servidor'
            });
        });

        it('should handle empty username in URL', async () => {
            const response = await request(app)
                .get('/api/user/')
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: 'Ruta no encontrada'
            });
        });
    });

    describe('Admin Promotion Error Cases', () => {
        it('should handle promotion errors gracefully', async () => {
            // Mock that user is not in organization (this will prevent promotion)
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            
            // Mock that user is not already a collaborator
            mockOctokit.rest.teams.getMembershipForUserInOrg.mockRejectedValue(notFoundError);
            
            // Mock that user is NOT in organization
            mockOctokit.rest.orgs.getMembershipForUser.mockRejectedValue(notFoundError);

            const response = await request(app)
                .post('/api/admin/promote/testuser')
                .send({
                    adminKey: 'test-admin-key',
                    reason: 'Test promotion'
                })
                .expect(200); // Should still return 200 but promotion doesn't happen

            expect(response.body).toEqual({
                success: true,
                message: 'Usuario testuser promovido manualmente a Colaborador'
            });
            
            // Verify promotion was not attempted since user is not in org
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });

        it('should handle missing reason parameter', async () => {
            // Setup successful promotion mocks
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            mockOctokit.rest.teams.getMembershipForUserInOrg.mockRejectedValue(notFoundError);
            
            mockOctokit.rest.orgs.getMembershipForUser.mockResolvedValue({
                data: { state: 'active' }
            });

            mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg.mockResolvedValue({
                data: { state: 'active' }
            });

            mockOctokit.rest.issues.create.mockResolvedValue({
                data: { number: 1 }
            });

            const response = await request(app)
                .post('/api/admin/promote/testuser')
                .send({
                    adminKey: 'test-admin-key'
                    // No reason provided
                })
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Usuario testuser promovido manualmente a Colaborador'
            });
        });
    });
});