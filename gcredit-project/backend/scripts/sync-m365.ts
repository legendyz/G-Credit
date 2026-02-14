/**
 * CLI Script: M365 User Sync
 *
 * Usage: npx ts-node scripts/sync-m365.ts [--type FULL|INCREMENTAL]
 *
 * This script runs the M365 user sync in standalone mode.
 * It uses the full NestJS application context to access all services.
 *
 * @see Story 8.9: M365 Production Hardening
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { M365SyncService } from '../src/m365-sync/m365-sync.service';
import { Logger } from '@nestjs/common';

type SyncType = 'FULL' | 'INCREMENTAL';

async function main() {
  const logger = new Logger('M365SyncCLI');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let syncType: SyncType = 'FULL';
  
  const typeIndex = args.indexOf('--type');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    const typeArg = args[typeIndex + 1].toUpperCase();
    if (typeArg === 'FULL' || typeArg === 'INCREMENTAL') {
      syncType = typeArg;
    } else {
      logger.error(`Invalid sync type: ${typeArg}. Use FULL or INCREMENTAL.`);
      process.exit(1);
    }
  }

  logger.log('Starting M365 Sync CLI...');
  logger.log(`Sync type: ${syncType}`);

  try {
    // Create NestJS application context (no HTTP server)
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get the M365 sync service
    const syncService = app.get(M365SyncService);

    // Run the sync
    logger.log('Running M365 sync...');
    const result = await syncService.runSync(syncType, 'CLI');

    // Output results
    logger.log('');
    logger.log('=== Sync Complete ===');
    logger.log(`Status: ${result.status}`);
    logger.log(`Total Users: ${result.totalUsers}`);
    logger.log(`Created: ${result.createdUsers}`);
    logger.log(`Updated: ${result.updatedUsers}`);
    logger.log(`Deactivated: ${result.deactivatedUsers}`);
    logger.log(`Failed: ${result.failedUsers}`);
    logger.log(`Duration: ${result.durationMs}ms`);

    if (result.errors.length > 0) {
      logger.warn('');
      logger.warn('=== Errors ===');
      result.errors.forEach((error) => {
        logger.warn(`  - ${error}`);
      });
    }

    // Clean up
    await app.close();

    // Exit with appropriate code
    process.exit(result.status === 'FAILED' ? 1 : 0);
  } catch (error) {
    logger.error(`Sync failed: ${(error as Error).message}`);
    logger.error((error as Error).stack);
    process.exit(1);
  }
}

main();
