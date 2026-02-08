import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphTokenProviderService } from './services/graph-token-provider.service';
import { GraphEmailService } from './services/graph-email.service';
import { GraphTeamsService } from './services/graph-teams.service';
import { TeamsBadgeNotificationService } from './teams/teams-badge-notification.service';
import { TeamsActionController } from './teams/teams-action.controller';
import { PrismaModule } from '../common/prisma.module';
import { BadgeNotificationService } from '../badge-issuance/services/badge-notification.service';

/**
 * Microsoft Graph Module
 *
 * Provides Microsoft Graph API integration for email and Teams notifications.
 *
 * Services:
 * - GraphTokenProviderService: OAuth 2.0 Client Credentials authentication
 * - GraphEmailService: Send emails via Graph API
 * - GraphTeamsService: Send Teams notifications via Graph API
 * - TeamsBadgeNotificationService: Send badge notifications to Teams with Adaptive Cards
 * - BadgeNotificationService: Email fallback for Teams notifications (Task 6)
 *
 * Controllers:
 * - TeamsActionController: Handle Adaptive Card action callbacks (Story 7.4 Task 5)
 *
 * @see ADR-008: Microsoft Graph Integration Strategy
 * @see Sprint 6 Story 0.4: Microsoft Graph Module Foundation
 * @see Sprint 6 Story 7.4: Microsoft Teams Notifications
 *
 * NOTE (TD-014): EmailModule import removed — EmailModule now imports
 * MicrosoftGraphModule (not the reverse) to get GraphEmailService.
 */
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [TeamsActionController],
  providers: [
    GraphTokenProviderService,
    GraphEmailService,
    GraphTeamsService,
    TeamsBadgeNotificationService,
    BadgeNotificationService,
  ],
  exports: [
    GraphTokenProviderService,
    GraphEmailService,
    GraphTeamsService,
    TeamsBadgeNotificationService,
  ],
})
export class MicrosoftGraphModule {}
