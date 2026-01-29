import { Module } from '@nestjs/common';
import { BadgeSharingController } from './badge-sharing.controller';
import { BadgeSharingService } from './badge-sharing.service';
import { EmailTemplateService } from './services/email-template.service';
import { PrismaModule } from '../common/prisma.module';
import { MicrosoftGraphModule } from '../microsoft-graph/microsoft-graph.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, MicrosoftGraphModule, ConfigModule],
  controllers: [BadgeSharingController],
  providers: [BadgeSharingService, EmailTemplateService],
  exports: [BadgeSharingService],
})
export class BadgeSharingModule {}
