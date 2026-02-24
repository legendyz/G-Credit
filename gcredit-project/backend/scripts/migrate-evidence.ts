/**
 * Story 12.5: Evidence Data Migration Script
 *
 * Migrates Badge.evidenceUrl → EvidenceFile(type=URL) records.
 * - Idempotent: skips if EvidenceFile(type=URL, sourceUrl=X) already exists for badge
 * - Dry-run mode: --dry-run flag to preview without writing
 * - Logging: count migrated, skipped, failed
 *
 * Usage:
 *   npx ts-node scripts/migrate-evidence.ts
 *   npx ts-node scripts/migrate-evidence.ts --dry-run
 */

import { PrismaClient, EvidenceType } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log(`Evidence Migration ${isDryRun ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(50));

  // 1. Find all badges with evidenceUrl set
  const badges = await prisma.badge.findMany({
    where: {
      evidenceUrl: { not: null },
    },
    select: {
      id: true,
      evidenceUrl: true,
      issuerId: true,
      issuedAt: true,
      evidenceFiles: {
        where: { type: EvidenceType.URL },
        select: { sourceUrl: true },
      },
    },
  });

  console.log(`Found ${badges.length} badges with evidenceUrl`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const badge of badges) {
    try {
      // Idempotency check: skip if URL-type evidence already exists
      const alreadyMigrated = badge.evidenceFiles.some(
        (ef) => ef.sourceUrl === badge.evidenceUrl,
      );

      if (alreadyMigrated) {
        skipped++;
        continue;
      }

      if (!isDryRun) {
        await prisma.evidenceFile.create({
          data: {
            badgeId: badge.id,
            type: EvidenceType.URL,
            sourceUrl: badge.evidenceUrl!,
            fileName: '',
            originalName: new URL(badge.evidenceUrl!).hostname,
            fileSize: 0,
            mimeType: '',
            blobUrl: '',
            uploadedBy: badge.issuerId,
            uploadedAt: badge.issuedAt,
          },
        });
      }

      migrated++;
      console.log(`  ✓ Badge ${badge.id}: ${badge.evidenceUrl}`);
    } catch (error) {
      failed++;
      console.error(
        `  ✗ Badge ${badge.id}: ${(error as Error).message}`,
      );
    }
  }

  console.log('='.repeat(50));
  console.log(
    `Results: ${migrated} migrated, ${skipped} skipped, ${failed} failed`,
  );

  if (isDryRun) {
    console.log('\nDry run complete. No data was written.');
    console.log('Run without --dry-run to execute migration.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
