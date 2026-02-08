import { Module } from '@nestjs/common';
import { BulkIssuanceController } from './bulk-issuance.controller';
import { BulkIssuanceService } from './bulk-issuance.service';
import { CsvValidationService } from './csv-validation.service';
import { PrismaModule } from '../common/prisma.module';
import { BadgeIssuanceModule } from '../badge-issuance/badge-issuance.module';

/**
 * Bulk Issuance Module
 *
 * Provides batch badge issuance functionality with:
 * - CSV template generation and validation
 * - Session-based preview workflow
 * - Synchronous batch processing via BadgeIssuanceService (Story 8.4)
 * - IDOR protection through ownership validation (ARCH-C2)
 * - CSV injection prevention (ARCH-C1)
 */
@Module({
  imports: [PrismaModule, BadgeIssuanceModule],
  controllers: [BulkIssuanceController],
  providers: [BulkIssuanceService, CsvValidationService],
  exports: [BulkIssuanceService, CsvValidationService],
})
export class BulkIssuanceModule {}
