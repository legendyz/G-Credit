/**
 * Story 12.5: Evidence Down Migration
 * Restores Badge.evidenceUrl from EvidenceFile(type=URL) records.
 *
 * Usage:
 *   npx ts-node scripts/migrate-evidence-down.ts
 *   npx ts-node scripts/migrate-evidence-down.ts --dry-run
 */

import { PrismaClient, EvidenceType } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

async function main() {
  console.log(`Evidence Down Migration ${isDryRun ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(50));

  // Find all URL-type evidence files
  const urlEvidence = await prisma.evidenceFile.findMany({
    where: { type: EvidenceType.URL },
    select: {
      id: true,
      badgeId: true,
      sourceUrl: true,
    },
  });

  console.log(`Found ${urlEvidence.length} URL-type evidence records`);

  let restored = 0;
  let failed = 0;

  for (const evidence of urlEvidence) {
    try {
      if (!isDryRun) {
        // Restore evidenceUrl on badge
        await prisma.badge.update({
          where: { id: evidence.badgeId },
          data: { evidenceUrl: evidence.sourceUrl },
        });

        // Delete the URL-type evidence file record
        await prisma.evidenceFile.delete({
          where: { id: evidence.id },
        });
      }

      restored++;
      console.log(
        `  ${isDryRun ? '[DRY RUN] ' : ''}✓ Badge ${evidence.badgeId}: restored ${evidence.sourceUrl}`,
      );
    } catch (error) {
      failed++;
      console.error(
        `  ✗ Badge ${evidence.badgeId}: ${(error as Error).message}`,
      );
    }
  }

  console.log('='.repeat(50));
  console.log(`Results: ${restored} restored, ${failed} failed`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
