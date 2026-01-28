import { Module } from '@nestjs/common';
import { BadgeVerificationController } from './badge-verification.controller';
import { BadgeVerificationService } from './badge-verification.service';
import { PrismaService } from '../common/prisma.service';
import { AssertionGeneratorService } from '../badge-issuance/services/assertion-generator.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [BadgeVerificationController],
  providers: [BadgeVerificationService, PrismaService, AssertionGeneratorService],
  exports: [BadgeVerificationService],
})
export class BadgeVerificationModule {}
