import { Module } from '@nestjs/common';
import { BadgeTemplatesController } from './badge-templates.controller';
import { BadgeTemplatesService } from './badge-templates.service';
import { PrismaModule } from '../common/prisma.module';
import { BlobStorageService } from '../common/services/blob-storage.service';
import { IssuanceCriteriaValidatorService } from '../common/services/issuance-criteria-validator.service';

@Module({
  imports: [PrismaModule],
  controllers: [BadgeTemplatesController],
  providers: [
    BadgeTemplatesService,
    BlobStorageService,
    IssuanceCriteriaValidatorService,
  ],
  exports: [BadgeTemplatesService],
})
export class BadgeTemplatesModule {}
