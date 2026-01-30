import { Module } from '@nestjs/common';
import { BadgeSharingController } from './badge-sharing.controller';
import { TeamsSharingController } from './controllers/teams-sharing.controller';
import { BadgeAnalyticsController } from './controllers/badge-analytics.controller';
import { BadgeSharingService } from './badge-sharing.service';
import { EmailTemplateService } from './services/email-template.service';
import { BadgeAnalyticsService } from './services/badge-analytics.service';
import { PrismaModule } from '../common/prisma.module';
import { MicrosoftGraphModule } from '../microsoft-graph/microsoft-graph.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, MicrosoftGraphModule, ConfigModule],
  controllers: [BadgeSharingController, TeamsSharingController, BadgeAnalyticsController],
  providers: [BadgeSharingService, EmailTemplateService, BadgeAnalyticsService],
  exports: [BadgeSharingService, BadgeAnalyticsService],
})
export class BadgeSharingModule {}
