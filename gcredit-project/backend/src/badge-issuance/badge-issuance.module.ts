import { Module } from '@nestjs/common';
import { BadgeIssuanceController } from './badge-issuance.controller';
import { BadgeIssuanceService } from './badge-issuance.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { BadgeNotificationService } from './services/badge-notification.service';
import { CSVParserService } from './services/csv-parser.service';
import { PrismaModule } from '../common/prisma.module';
import { EmailModule } from '../common/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [BadgeIssuanceController],
  providers: [
    BadgeIssuanceService,
    AssertionGeneratorService,
    BadgeNotificationService,
    CSVParserService,
  ],
  exports: [BadgeIssuanceService],
})
export class BadgeIssuanceModule {}
