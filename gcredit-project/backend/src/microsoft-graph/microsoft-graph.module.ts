import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphTokenProviderService } from './services/graph-token-provider.service';
import { GraphEmailService } from './services/graph-email.service';
import { GraphTeamsService } from './services/graph-teams.service';

/**
 * Microsoft Graph Module
 * 
 * Provides Microsoft Graph API integration for email and Teams notifications.
 * 
 * Services:
 * - GraphTokenProviderService: OAuth 2.0 Client Credentials authentication
 * - GraphEmailService: Send emails via Graph API
 * - GraphTeamsService: Send Teams notifications via Graph API
 * 
 * @see ADR-008: Microsoft Graph Integration Strategy
 * @see Sprint 6 Story 0.4: Microsoft Graph Module Foundation
 */
@Module({
  imports: [ConfigModule],
  providers: [
    GraphTokenProviderService,
    GraphEmailService,
    GraphTeamsService,
  ],
  exports: [
    GraphTokenProviderService,
    GraphEmailService,
    GraphTeamsService,
  ],
})
export class MicrosoftGraphModule {}
