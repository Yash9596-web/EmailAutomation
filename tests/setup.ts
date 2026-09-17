// Global test setup — runs before all test suites

// Set test environment
// @ts-ignore - TS treats NODE_ENV as readonly, but we must override it for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test_db';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
