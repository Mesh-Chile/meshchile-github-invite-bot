const request = require('supertest');

// Mock Octokit before importing the app
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
jest.mock('axios', () => ({
    post: jest.fn(() => Promise.resolve({
        data: {
            success: true,
            score: 0.9,
            action: 'github_invite'
        }
    }))
}));

const app = require('../server.js');

describe('API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset rate limiter state
        jest.restoreAllMocks();
    });

    describe('GET /api/config', () => {
        it('should return public configuration', async () => {
            const response = await request(app)
                .get('/api/config')
                .expect(200);

            expect(response.body).toEqual({
                recaptchaSiteKey: 'test-recaptcha-site',
                githubOrg: 'Test-Org',
                environment: 'test'
            });
        });
    });

    describe('GET /api/bot/status', () => {
        it('should return bot status information', async () => {
            const response = await request(app)
                .get('/api/bot/status')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'active',
                organization: 'Test-Org',
                teams: {
                    community: 'test-comunidad',
                    collaborators: 'test-colaboradores'
                },
                security: {
                    rateLimiting: 'enabled',
                    recaptcha: 'enabled',
                    webhookSecret: 'configured'
                },
                features: expect.any(Array),
                uptime: expect.any(Number),
                nodeVersion: expect.any(String),
                environment: 'test'
            });
        });
    });

    describe('GET /api/stats', () => {
        it('should return organization statistics', async () => {
            const mockOrgData = {
                name: 'Test Organization',
                description: 'Test description',
                public_repos: 10,
                followers: 50,
                created_at: '2023-01-01T00:00:00Z'
            };

            mockOctokit.rest.orgs.get.mockResolvedValue({ data: mockOrgData });

            const response = await request(app)
                .get('/api/stats')
                .expect(200);

            expect(response.body).toMatchObject({
                organization: mockOrgData,
                bot: {
                    uptime: expect.any(Number),
                    status: 'active'
                }
            });

            expect(mockOctokit.rest.orgs.get).toHaveBeenCalledWith({ org: 'Test-Org' });
        });

        it('should handle error when getting stats', async () => {
            mockOctokit.rest.orgs.get.mockRejectedValue(new Error('API Error'));

            const response = await request(app)
                .get('/api/stats')
                .expect(500);

            expect(response.body).toEqual({
                error: 'Error obteniendo estadísticas'
            });
        });
    });

    describe('GET /api/user/:username', () => {
        it('should return user preview data', async () => {
            const mockUserData = {
                login: 'testuser',
                name: 'Test User',
                avatar_url: 'https://avatar.url',
                bio: 'Test bio',
                location: 'Test location',
                public_repos: 5,
                followers: 10,
                created_at: '2023-01-01T00:00:00Z'
            };

            mockOctokit.rest.users.getByUsername.mockResolvedValue({ data: mockUserData });

            const response = await request(app)
                .get('/api/user/testuser')
                .expect(200);

            expect(response.body).toEqual({
                login: 'testuser',
                name: 'Test User',
                avatar_url: 'https://avatar.url',
                bio: 'Test bio',
                location: 'Test location',
                public_repos: 5,
                followers: 10,
                created_at: '2023-01-01T00:00:00Z'
            });

            expect(mockOctokit.rest.users.getByUsername).toHaveBeenCalledWith({ username: 'testuser' });
        });

        it('should return 400 for invalid username format', async () => {
            const response = await request(app)
                .get('/api/user/invalid-username-!')
                .expect(400);

            expect(response.body).toEqual({
                error: 'Formato de username inválido'
            });
        });

        it('should return 404 for non-existent user', async () => {
            const error = new Error('Not Found');
            error.status = 404;
            mockOctokit.rest.users.getByUsername.mockRejectedValue(error);

            const response = await request(app)
                .get('/api/user/nonexistent')
                .expect(404);

            expect(response.body).toEqual({
                error: 'Usuario no encontrado'
            });
        });
    });

    describe('POST /api/invite', () => {
        const validInviteData = {
            username: 'testuser',
            recaptchaToken: 'valid-token'
        };

        beforeEach(() => {
            // Setup default successful mocks
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

        it('should successfully send invitation', async () => {
            const response = await request(app)
                .post('/api/invite')
                .send(validInviteData)
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Invitación enviada exitosamente a testuser',
                user: {
                    username: 'testuser',
                    name: 'Test User',
                    avatar: 'https://avatar.url'
                },
                teamAssigned: true
            });

            // The server no longer calls createInvitation - it only adds to team
            expect(mockOctokit.rest.orgs.createInvitation).not.toHaveBeenCalled();

            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).toHaveBeenCalledWith({
                org: 'Test-Org',
                team_slug: 'test-comunidad',
                username: 'testuser',
                role: 'member'
            });
        });

        it('should return 400 for missing username', async () => {
            const response = await request(app)
                .post('/api/invite')
                .send({ recaptchaToken: 'valid-token' })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Nombre de usuario requerido'
            });
        });

        it('should return 400 for invalid username format', async () => {
            const response = await request(app)
                .post('/api/invite')
                .send({
                    username: 'invalid-user-!',
                    recaptchaToken: 'valid-token'
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: 'Formato de nombre de usuario inválido'
            });
        });

        it('should return 404 for non-existent GitHub user', async () => {
            const error = new Error('Not Found');
            error.status = 404;
            mockOctokit.rest.users.getByUsername.mockRejectedValue(error);

            const response = await request(app)
                .post('/api/invite')
                .send(validInviteData)
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: 'Usuario no encontrado en GitHub'
            });
        });

        it('should return 409 for user already in organization', async () => {
            mockOctokit.rest.orgs.getMembershipForUser.mockResolvedValue({
                data: { state: 'active' }
            });

            const response = await request(app)
                .post('/api/invite')
                .send(validInviteData)
                .expect(409);

            expect(response.body).toEqual({
                success: false,
                message: 'El usuario ya es miembro de la organización'
            });
        });
    });

    describe('POST /api/admin/promote/:username', () => {
        it('should successfully promote user with valid admin key', async () => {
            // Mock successful promotion
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
                    adminKey: 'test-admin-key',
                    reason: 'Test promotion'
                })
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Usuario testuser promovido manualmente a Colaborador'
            });
        });

        it('should return 401 for invalid admin key', async () => {
            const response = await request(app)
                .post('/api/admin/promote/testuser')
                .send({
                    adminKey: 'wrong-key',
                    reason: 'Test promotion'
                })
                .expect(401);

            expect(response.body).toEqual({
                success: false,
                message: 'No autorizado'
            });
        });
    });

    describe('404 handler', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/non-existent-route')
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: 'Ruta no encontrada'
            });
        });
    });
});