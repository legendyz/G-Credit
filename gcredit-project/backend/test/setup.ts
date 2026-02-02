/**
 * Jest E2E Test Setup (Story 8.8 - AC1)
 * TD-001: Runs before each test file
 *
 * Sets up global test environment configuration.
 */

// Story 8.8: Set higher rate limits for E2E tests to prevent 429 errors
process.env.RATE_LIMIT_MAX = '1000'; // 1000 requests per minute in tests
process.env.RATE_LIMIT_TTL = '60000';
process.env.THROTTLE_TTL = '60000';
process.env.THROTTLE_LIMIT = '1000';

// CI Environment Detection
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

if (isCI) {
  console.log('🔄 Running in CI environment (GitHub Actions)');
  // Disable Azure Storage in CI (will use mocks)
  process.env.AZURE_STORAGE_CONNECTION_STRING = '';
}

// Increase test timeout for E2E tests
jest.setTimeout(60000);

// Suppress console.log during tests (optional)
// global.console.log = jest.fn();

// Add custom matchers or global utilities here
beforeAll(async () => {
  // Any global setup needed before all tests
  console.log('🧪 E2E Test Suite Starting...');
});

afterAll(async () => {
  // Any global cleanup needed after all tests
  console.log('🧪 E2E Test Suite Complete');
});
