// Test setup file
process.env.NODE_ENV = 'test';
process.env.GITHUB_TOKEN = 'test-token';
process.env.GITHUB_ORG = 'Test-Org';
process.env.COMMUNITY_TEAM = 'test-comunidad';
process.env.COLLABORATORS_TEAM = 'test-colaboradores';
process.env.RECAPTCHA_SECRET_KEY = 'test-recaptcha-secret';
process.env.RECAPTCHA_SITE_KEY = 'test-recaptcha-site';
process.env.ADMIN_KEY = 'test-admin-key';
process.env.GITHUB_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.WELCOME_REPO = 'test-bienvenidos';

// Mock console.log para tests más limpios
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

// Timeout global para tests
jest.setTimeout(10000);