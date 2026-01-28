import { Module } from '@nestjs/common';
import { BadgeVerificationController } from './badge-verification.controller';
import { BadgeVerificationService } from './badge-verification.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [BadgeVerificationController],
  providers: [BadgeVerificationService, PrismaService],
  exports: [BadgeVerificationService],
})
export class BadgeVerificationModule {}
