/**
 * Test Database Isolation Helper (Story 8.8 - AC1)
 * TD-001: Schema-based test isolation for parallel E2E tests
 *
 * Each test suite gets its own PostgreSQL schema to prevent
 * data conflicts during parallel execution.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

// Store schema names for cleanup
const activeSchemas = new Map<string, string>();

/**
 * Creates an isolated database schema for a test suite
 * @param suiteName - Unique identifier for the test suite
 * @returns PrismaClient connected to the isolated schema
 */
export async function createTestSchema(suiteName: string): Promise<{
  prisma: PrismaClient;
  schemaName: string;
}> {
  // Generate unique schema name with timestamp and UUID
  const timestamp = Date.now();
  const uniqueId = uuidv4().substring(0, 8);
  const schemaName = `test_${suiteName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}_${uniqueId}`;

  // Get base database URL
  const baseUrl = process.env.DATABASE_URL || '';
  if (!baseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create schema URL (append schema parameter)
  const schemaUrl = appendSchemaToUrl(baseUrl, schemaName);
  console.log(
    `📝 Creating schema with URL: ${schemaUrl.replace(/:[^:@]*@/, ':****@')}`,
  ); // Hide password

  // Create Prisma client with isolated schema
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: schemaUrl,
      },
    },
  });

  try {
    // Create the schema in the base database
    await prisma.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
    );

    // Disconnect initial connection
    await prisma.$disconnect();

    // Run Prisma migrations on the new schema using DATABASE_URL with schema parameter
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      env: {
        ...process.env,
        DATABASE_URL: schemaUrl,
      },
      stdio: 'pipe', // Suppress output
      cwd: process.cwd(),
    });

    // Reconnect to the schema
    await prisma.$connect();

    // Set default search_path for all operations in this client
    await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}"`);

    // Store for cleanup
    activeSchemas.set(suiteName, schemaName);

    console.log(`✅ Created test schema: ${schemaName}`);
    return { prisma, schemaName };
  } catch (error) {
    console.error(`❌ Failed to create test schema: ${schemaName}`, error);
    await prisma.$disconnect();
    throw error;
  }
}

/**
 * Drops a test schema and disconnects the client
 * @param prisma - PrismaClient to disconnect
 * @param schemaName - Schema name to drop
 */
export async function dropTestSchema(
  prisma: PrismaClient,
  schemaName: string,
): Promise<void> {
  try {
    // Get the base URL to create admin connection
    const baseUrl = process.env.DATABASE_URL || '';
    const adminPrisma = new PrismaClient({
      datasources: { db: { url: baseUrl } },
    });

    // Drop the schema cascade
    await adminPrisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
    );

    await adminPrisma.$disconnect();
    await prisma.$disconnect();

    // Remove from tracking
    for (const [key, value] of activeSchemas.entries()) {
      if (value === schemaName) {
        activeSchemas.delete(key);
        break;
      }
    }

    console.log(`🗑️ Dropped test schema: ${schemaName}`);
  } catch (error) {
    console.error(`⚠️ Failed to drop test schema: ${schemaName}`, error);
    // Still try to disconnect
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}

/**
 * Cleans up all active test schemas (for global teardown)
 */
export async function cleanupAllTestSchemas(): Promise<void> {
  const baseUrl = process.env.DATABASE_URL || '';
  if (!baseUrl) return;

  const adminPrisma = new PrismaClient({
    datasources: { db: { url: baseUrl } },
  });

  for (const [suiteName, schemaName] of activeSchemas.entries()) {
    try {
      await adminPrisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`,
      );
      console.log(
        `🗑️ Cleaned up orphaned schema: ${schemaName} (${suiteName})`,
      );
    } catch (error) {
      console.error(`⚠️ Failed to cleanup schema: ${schemaName}`, error);
    }
  }

  activeSchemas.clear();
  await adminPrisma.$disconnect();
}

/**
 * Cleans up stale test schemas older than a given time
 * @param maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 */
export async function cleanupStaleSchemas(maxAgeMs = 3600000): Promise<void> {
  const baseUrl = process.env.DATABASE_URL || '';
  if (!baseUrl) return;

  const adminPrisma = new PrismaClient({
    datasources: { db: { url: baseUrl } },
  });

  try {
    // Get all test schemas
    const schemas = await adminPrisma.$queryRaw<Array<{ schema_name: string }>>`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'test_%'
    `;

    const now = Date.now();
    let cleanedCount = 0;

    for (const { schema_name } of schemas) {
      // Extract timestamp from schema name (test_xxx_TIMESTAMP_uuid)
      const parts = schema_name.split('_');
      if (parts.length >= 3) {
        const timestamp = parseInt(parts[parts.length - 2], 10);
        if (!isNaN(timestamp) && now - timestamp > maxAgeMs) {
          await adminPrisma.$executeRawUnsafe(
            `DROP SCHEMA IF EXISTS "${schema_name}" CASCADE`,
          );
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} stale test schemas`);
    }
  } catch (error) {
    console.error('⚠️ Failed to cleanup stale schemas:', error);
  } finally {
    await adminPrisma.$disconnect();
  }
}

/**
 * Helper to append schema parameter to database URL
 * For PostgreSQL, this adds ?schema=xxx or &schema=xxx
 */
function appendSchemaToUrl(baseUrl: string, schemaName: string): string {
  // PostgreSQL connections with schema parameter
  // Format: postgresql://user:pass@host:port/db?schema=myschema
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}schema=${encodeURIComponent(schemaName)}`;
}

/**
 * Get the current test schema name for a suite
 */
export function getTestSchemaName(suiteName: string): string | undefined {
  return activeSchemas.get(suiteName);
}
