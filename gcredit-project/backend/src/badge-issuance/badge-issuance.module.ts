import { Module } from '@nestjs/common';
import { BadgeIssuanceController } from './badge-issuance.controller';
import { BadgeIssuanceService } from './badge-issuance.service';
import { AssertionGeneratorService } from './services/assertion-generator.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BadgeIssuanceController],
  providers: [BadgeIssuanceService, AssertionGeneratorService],
  exports: [BadgeIssuanceService],
})
export class BadgeIssuanceModule {}
