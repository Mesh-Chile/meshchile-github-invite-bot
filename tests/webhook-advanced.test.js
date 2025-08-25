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

describe('Webhook Advanced Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createSignature = (payload, secret) => {
        return 'sha256=' + crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    };

    describe('Webhook Error Handling', () => {
        it('should handle malformed JSON in webhook', async () => {
            const malformedPayload = '{ invalid json }';
            const signature = createSignature(malformedPayload, 'test-webhook-secret');

            const response = await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(malformedPayload)
                .expect(500);

            expect(response.text).toBe('Error');
        });

        it('should handle missing event header', async () => {
            const payload = { action: 'created', sender: { login: 'testuser' } };
            const payloadString = JSON.stringify(payload);
            const signature = createSignature(payloadString, 'test-webhook-secret');

            await request(app)
                .post('/webhook/github')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', signature)
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);
        });

        it('should handle webhook without signature when secret is not configured', async () => {
            // Temporarily remove webhook secret
            const originalSecret = process.env.GITHUB_WEBHOOK_SECRET;
            delete process.env.GITHUB_WEBHOOK_SECRET;

            const payload = { action: 'created', sender: { login: 'testuser' } };
            const payloadString = JSON.stringify(payload);

            const response = await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(200);

            expect(response.text).toBe('OK');

            // Restore webhook secret
            process.env.GITHUB_WEBHOOK_SECRET = originalSecret;
        });
    });

    describe('Promotion Logic Edge Cases', () => {
        it('should handle promotion when congratulations message fails', async () => {
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

            // Failed congratulations message
            mockOctokit.rest.issues.create.mockRejectedValue(new Error('Issue creation failed'));

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
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).toHaveBeenCalled();
            expect(mockOctokit.rest.issues.create).toHaveBeenCalled();
        });

        it('should handle non-404 errors when checking team membership', async () => {
            // API error when checking team membership
            const apiError = new Error('API Error');
            apiError.status = 500;
            mockOctokit.rest.teams.getMembershipForUserInOrg.mockRejectedValue(apiError);

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

            // Should not proceed with promotion due to error
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });

        it('should handle non-404 errors when checking organization membership', async () => {
            // User is not already a collaborator
            const notFoundError = new Error('Not Found');
            notFoundError.status = 404;
            mockOctokit.rest.teams.getMembershipForUserInOrg.mockRejectedValue(notFoundError);
            
            // API error when checking org membership
            const apiError = new Error('API Error');
            apiError.status = 500;
            mockOctokit.rest.orgs.getMembershipForUser.mockRejectedValue(apiError);

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

            // Should not proceed with promotion due to error
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });
    });

    describe('Event Variations', () => {
        beforeEach(() => {
            // Setup successful promotion
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
        });

        it('should handle push event without commits', async () => {
            const payload = {
                commits: [], // Empty commits array
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

            // Should not promote for push without commits
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });

        it('should handle push event with sender.login when pusher.name is not available', async () => {
            const payload = {
                commits: [{ message: 'Test commit' }],
                sender: { login: 'testuser' },
                pusher: { name: null }, // Null pusher name, should fall back to sender.login
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
        });

        it('should handle repository event with different actions', async () => {
            const payload = {
                action: 'deleted', // Different action, should not promote
                sender: { login: 'testuser' },
                repository: {
                    owner: { login: 'Test-Org' },
                    name: 'deleted-repo'
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

            // Should not promote for deleted repository
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });

        it('should handle pull_request event with different actions', async () => {
            const payload = {
                action: 'closed', // Different action, should not promote
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

            // Should not promote for closed PR
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });

        it('should handle issues event with different actions', async () => {
            const payload = {
                action: 'closed', // Different action, should not promote
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

            // Should not promote for closed issue
            expect(mockOctokit.rest.teams.addOrUpdateMembershipForUserInOrg).not.toHaveBeenCalled();
        });
    });

    describe('Webhook Security Edge Cases', () => {
        it('should handle missing signature header', async () => {
            const payload = { action: 'created', sender: { login: 'testuser' } };
            const payloadString = JSON.stringify(payload);

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                // No signature header
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(401);
        });

        it('should handle empty signature header', async () => {
            const payload = { action: 'created', sender: { login: 'testuser' } };
            const payloadString = JSON.stringify(payload);

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', '') // Empty signature
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(401);
        });

        it('should handle malformed signature header', async () => {
            const payload = { action: 'created', sender: { login: 'testuser' } };
            const payloadString = JSON.stringify(payload);

            await request(app)
                .post('/webhook/github')
                .set('x-github-event', 'repository')
                .set('x-github-delivery', 'test-delivery-id')
                .set('x-hub-signature-256', 'malformed-signature') // No sha256= prefix
                .set('content-type', 'application/json')
                .send(payloadString)
                .expect(401);
        });
    });
});