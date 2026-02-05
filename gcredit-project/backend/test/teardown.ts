/**
 * Jest E2E Test Teardown (Story 8.8 - AC1)
 * TD-001: Global teardown after all tests complete
 *
 * Cleans up any orphaned test schemas.
 */

import { cleanupStaleSchemas } from './helpers/test-database';

export default async function globalTeardown() {
  console.log('🧹 Running global test teardown...');

  try {
    // Clean up any stale test schemas older than 30 minutes
    await cleanupStaleSchemas(30 * 60 * 1000);
    console.log('✅ Global teardown complete');
  } catch (error) {
    console.error('⚠️ Error during global teardown:', error);
  }
}
