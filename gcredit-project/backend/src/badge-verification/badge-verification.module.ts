import { Module } from '@nestjs/common';
import { BadgeVerificationController } from './badge-verification.controller';
import { BadgeVerificationService } from './badge-verification.service';
import { PrismaModule } from '../common/prisma.module';
import { AssertionGeneratorService } from '../badge-issuance/services/assertion-generator.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [BadgeVerificationController],
  providers: [BadgeVerificationService, AssertionGeneratorService],
  exports: [BadgeVerificationService],
})
export class BadgeVerificationModule {}
