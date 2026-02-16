/**
 * Cleanup Orphaned Azure Blob Storage Files
 *
 * After re-seeding the database, blob files uploaded during previous
 * testing sessions become orphaned (DB references point to placeholder URLs).
 * This script lists and deletes ALL blobs in both containers.
 *
 * Usage: npx ts-node scripts/cleanup-blobs.ts [--dry-run]
 */

import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const BADGES_CONTAINER = process.env.AZURE_STORAGE_CONTAINER_BADGES || 'badges';
const EVIDENCE_CONTAINER =
  process.env.AZURE_STORAGE_CONTAINER_EVIDENCE || 'evidence';

const DRY_RUN = process.argv.includes('--dry-run');

async function cleanupContainer(
  blobServiceClient: BlobServiceClient,
  containerName: string,
): Promise<number> {
  const containerClient =
    blobServiceClient.getContainerClient(containerName);

  // Check if container exists
  const exists = await containerClient.exists();
  if (!exists) {
    console.log(`  Container "${containerName}" does not exist — skipping.`);
    return 0;
  }

  let count = 0;
  const errors: string[] = [];

  console.log(`  Scanning container "${containerName}"...`);

  for await (const blob of containerClient.listBlobsFlat()) {
    count++;
    if (DRY_RUN) {
      console.log(`    [DRY-RUN] Would delete: ${blob.name} (${blob.properties.contentLength} bytes)`);
    } else {
      try {
        await containerClient.deleteBlob(blob.name);
        console.log(`    Deleted: ${blob.name}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${blob.name}: ${msg}`);
        console.error(`    ❌ Failed to delete ${blob.name}: ${msg}`);
      }
    }
  }

  if (errors.length > 0) {
    console.log(`  ⚠️  ${errors.length} errors in "${containerName}"`);
  }

  return count;
}

async function main() {
  if (!CONNECTION_STRING) {
    console.error(
      '❌ AZURE_STORAGE_CONNECTION_STRING not set. Check .env file.',
    );
    process.exit(1);
  }

  console.log('=== Azure Blob Storage Cleanup ===');
  if (DRY_RUN) {
    console.log('🔍 DRY-RUN mode — no files will be deleted.\n');
  } else {
    console.log('🗑️  DELETE mode — orphaned blobs will be removed.\n');
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(CONNECTION_STRING);

  const badgesCount = await cleanupContainer(blobServiceClient, BADGES_CONTAINER);
  const evidenceCount = await cleanupContainer(blobServiceClient, EVIDENCE_CONTAINER);

  const total = badgesCount + evidenceCount;

  console.log('\n=== Summary ===');
  console.log(`  Badges container:  ${badgesCount} blob(s)`);
  console.log(`  Evidence container: ${evidenceCount} blob(s)`);
  console.log(`  Total:             ${total} blob(s) ${DRY_RUN ? 'found' : 'deleted'}`);

  if (total === 0) {
    console.log('\n✅ Both containers are already empty.');
  } else if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to delete these blobs.');
  } else {
    console.log('\n✅ Cleanup complete.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
