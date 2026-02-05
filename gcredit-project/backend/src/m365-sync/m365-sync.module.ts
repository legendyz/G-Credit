import { Module } from '@nestjs/common';
import { M365SyncController } from './m365-sync.controller';
import { M365SyncService } from './m365-sync.service';
import { PrismaModule } from '../common/prisma.module';
import { MicrosoftGraphModule } from '../microsoft-graph/microsoft-graph.module';

/**
 * M365 Sync Module
 *
 * Provides Microsoft 365 user synchronization functionality:
 * - Production-grade sync with pagination for 1000+ users
 * - Retry logic with exponential backoff (ADR-008)
 * - Audit logging via M365SyncLog table
 * - User deactivation sync
 * - Per-user error recovery
 *
 * @see Story 8.9: M365 Production Hardening
 */
@Module({
  imports: [PrismaModule, MicrosoftGraphModule],
  controllers: [M365SyncController],
  providers: [M365SyncService],
  exports: [M365SyncService],
})
export class M365SyncModule {}
