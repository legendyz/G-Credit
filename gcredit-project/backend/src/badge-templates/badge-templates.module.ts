import { Module } from '@nestjs/common';
import { BadgeTemplatesController } from './badge-templates.controller';
import { BadgeTemplatesService } from './badge-templates.service';
import { PrismaModule } from '../common/prisma.module';
import { BlobStorageService } from '../common/services/blob-storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [BadgeTemplatesController],
  providers: [BadgeTemplatesService, BlobStorageService],
  exports: [BadgeTemplatesService],
})
export class BadgeTemplatesModule {}
