const request = require('supertest');
const crypto = require('crypto');

// Mock Octokit
const mockOctokit = {
    rest: {
        teams: {
            getMembershipForUserInOrg: jest.fn(),
            addOrUpdateMembershipForUserInOrg: jest.fn()
        },
        orgs: {
            getMembershipForUser: jest.fn()
        },
        issues: {
            create: jest.fn()
        }
    }
};

jest.mock('@octokit/rest', () => ({
    Octokit: jest.fn(() => mockOctokit)
}));

jest.mock('axios', () => ({
    post: jest.fn(() => Promise.resolve({
        data: { success: true, score: 0.9, action: 'github_invite' }
    }))
}));

const app = require('../server.js');

describe('Webhook Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createSignature = (payload, secret) => {
        return 'sha256=' + crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    };

    const setupSuccessfulPromotion = () => {
        // User is not already a collaborator
        const notFoundError = new Error('Not Found');
        notFoundError.status = 404;
        mockOctokit.rest.teams.getMembershipForUserInOrg.mockRejectedValue(notFoundError);
        
        // User is a member of the organization
        mockOctokit.rest.orgs.getMembershipForUser.mockResolvedValue({
            data: { state: 'active' }
        });

        // Successful promotion
        mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg.mockResolvedValue({
            data: { state: 'active' }
        });

        // Successful congratulations message
        mockOctokit.rest.issues.create.mockResolvedValue({
            data: { number: 1 }
        });
    };

    describe('POST /webhook/github', () => {
        it('should handle repository created event', async () => {
            setupSuccessfulPromotion();

            const payload = {
                action: 'created',
                sender: { login: 'testuser' },
                repository: {
                    owner: { login: 'Test-Org' },
                    name: 'new-repo'
                }
            };

            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            const response = await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            expect(response.text).toBe('OK');

            // Verify promotion was attempted
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).toHaveBeenCalledWith({
                org: 'Test-Org',
                team_slug: 'test-colaboradores',
                username: 'testuser',
                role: 'member'
            });

            // Verify congratulations message was sent
            expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith({
                owner: 'Test-Org',
                repo: 'test-bienvenidos',
                title: '🎉 ¡Felicitaciones @testuser! Promovido a Colaborador',
                body: expect.stringContaining('Razón de la promoción:** Creó repositorio'),
                labels: ['bienvenida', 'promocion', 'colaborador']
            });
        });

        it('should handle push event', async () => {
            setupSuccessfulPromotion();

            const payload = {
                commits: [
                    { message: 'First commit' },
                    { message: 'Second commit' }
                ],
                pusher: { name: 'testuser' },
                sender: { login: 'testuser' },
                repository: {
                    owner: { login: 'Test-Org' },
                    name: 'test-repo'
                }
            };

            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'push')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).toHaveBeenCalledWith({
                org: 'Test-Org',
                team_slug: 'test-colaboradores',
                username: 'testuser',
                role: 'member'
            });

            expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: '🎉 ¡Felicitaciones @testuser! Promovido a Colaborador',
                    body: expect.stringContaining('Push con 2 commits')
                })
            );
        });

        it('should handle pull request opened event', async () => {
            setupSuccessfulPromotion();

            const payload = {
                action: 'opened',
                pull_request: {
                    user: { login: 'testuser' }
                },
                repository: {
                    owner: { login: 'Test-Org' },
                    name: 'test-repo'
                }
            };

            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'pull_request')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.stringContaining('Abrió Pull Request')
                })
            );
        });

        it('should handle issues opened event', async () => {
            setupSuccessfulPromotion();

            const payload = {
                action: 'opened',
                issue: {
                    user: { login: 'testuser' }
                },
                repository: {
                    owner: { login: 'Test-Org' },
                    name: 'test-repo'
                }
            };

            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'issues')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            expect(mockOctokit.rest.issues.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.stringContaining('Creó Issue')
                })
            );
        });

        it('should return 401 for invalid signature', async () => {
            const payload = {
                action: 'created',
                sender: { login: 'testuser' }
            };

            const payloadString = JSON.stringify(payload);

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', 'sha256=invalid-signature')
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(401);
        });

        it('should ignore non-promotion events', async () => {
            const payload = {
                action: 'deleted',
                sender: { login: 'testuser' }
            };

            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'ping')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            // Should not attempt promotion
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });

        it('should not promote user already in collaborators team', async () => {
            // User is already a collaborator
            mockOctokit.rest.teams.getMembershipForUserInOrg.mockResolvedValue({
                data: { state: 'active' }
            });

            const payload = {
                action: 'created',
                sender: { login: 'testuser' },
                repository: {
                    owner: { login: 'Test-Org' },
                    name: 'new-repo'
                }
            };

            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            // Should not attempt to add to team (already a member)
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });

        it('should not promote user not in organization', async () => {
            // User is not in collaborators team
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            mockOctokit.rest.teams.getMembershipForUserInOrg.mockRejectedValue(notFoundError);
            
            // User is not in organization
            mockOctokit.rest.orgs.getMembershipForUser.mockRejectedValue(notFoundError);

            const payload = {
                action: 'created',
                sender: { login: 'outsider' },
                repository: {
                    owner: { login: 'Test-Org' },
                    name: 'new-repo'
                }
            };

            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            // Should not promote user not in organization
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });

        it('should only promote for organization events', async () => {
            setupSuccessfulPromotion();

            const payload = {
                action: 'created',
                sender: { login: 'testuser' },
                repository: {
                    owner: { login: 'Other-Org' }, // Different organization
                    name: 'new-repo'
                }
            };

            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            // Should not promote for different organization
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });
    });
});