const request = require('supertest');

// Mock Octokit
const mockOctokit = {
    rest: {
        orgs: {
            get: jest.fn()
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

describe('Configuration Edge Cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockOctokit.rest.orgs.get.mockResolvedValue({
            data: {
                name: 'Test Organization',
                description: 'Test description',
                public_repos: 10,
                followers: 50,
                created_at: '2023-01-01T00:00:00Z'
            }
        });
    });

    describe('Environment Detection', () => {
        it('should return test environment in config', async () => {
            const response = await request(app)
                .get('/api/config')
                .expect(200);

            expect(response.body).toMatchObject({
                githubOrg: 'Test-Org',
                environment: 'test'
            });
        });

        it('should show test environment in bot status', async () => {
            const response = await request(app)
                .get('/api/bot/status')
                .expect(200);

            expect(response.body.environment).toBe('test');
        });
    });

    describe('reCAPTCHA Configuration', () => {
        it('should show reCAPTCHA as enabled when configured', async () => {
            const response = await request(app)
                .get('/api/bot/status')
                .expect(200);

            // Should be enabled since we have RECAPTCHA_SECRET_KEY in test setup
            expect(response.body.security.recaptcha).toBe('enabled');
        });
    });

    describe('Webhook Configuration', () => {
        it('should show webhook secret as configured when present', async () => {
            const response = await request(app)
                .get('/api/bot/status')
                .expect(200);

            // Should be configured since we have GITHUB_WEBHOOK_SECRET in test setup
            expect(response.body.security.webhookSecret).toBe('configured');
        });
    });
});