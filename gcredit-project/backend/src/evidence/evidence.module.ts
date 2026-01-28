import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { PrismaService } from '../common/prisma.service';
import { StorageService } from '../common/storage.service';

@Module({
  controllers: [EvidenceController],
  providers: [EvidenceService, PrismaService, StorageService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
