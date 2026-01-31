import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';
import { GraphTokenProviderService } from './graph-token-provider.service';

/**
 * Microsoft Graph Teams Service
 * 
 * Sends Microsoft Teams notifications via Graph API (TeamsActivity.Send permission).
 * Supports Adaptive Cards for rich notification experiences.
 * 
 * @see ADR-008: Microsoft Graph Integration Strategy
 * @see Sprint 6 Story 7.4: Microsoft Teams Notifications
 */
@Injectable()
export class GraphTeamsService implements OnModuleInit {
  private readonly logger = new Logger(GraphTeamsService.name);
  private graphClient: Client;
  private isEnabled: boolean;

  constructor(
    private readonly tokenProvider: GraphTokenProviderService,
    private readonly configService: ConfigService,
  ) {
    // Task 7: Use new ENABLE_TEAMS_NOTIFICATIONS config
    this.isEnabled = this.configService.get<string>(
      'ENABLE_TEAMS_NOTIFICATIONS',
      'false',
    ) === 'true';

    if (!this.isEnabled) {
      this.logger.warn('⚠️ Teams notifications disabled (ENABLE_TEAMS_NOTIFICATIONS=false)');
    }
  }

  /**
   * Initialize Graph client after all dependencies are ready
   */
  async onModuleInit() {
    if (this.isEnabled) {
      try {
        this.initializeClient();
      } catch (error) {
        this.logger.error('❌ Failed to initialize Graph Teams on module init', error);
        this.isEnabled = false;
      }
    }
  }

  /**
   * Initialize Microsoft Graph client with token provider
   */
  private initializeClient() {
    try {
      const authProvider = this.tokenProvider.getAuthProvider();

      this.graphClient = Client.initWithMiddleware({
        authProvider,
      });

      this.logger.log('✅ Graph Teams Service initialized');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Graph Teams client', error);
      this.isEnabled = false;
    }
  }

  /**
   * Send Teams channel message notification
   * 
   * Sends message directly to a Teams channel with optional Adaptive Card.
   * Uses /teams/{teamId}/channels/{channelId}/messages endpoint.
   * This approach does NOT require a Teams App to be deployed.
   * 
   * @param teamId - Target team ID
   * @param channelId - Target channel ID
   * @param message - Plain text message content
   * @param adaptiveCard - Optional Adaptive Card JSON
   * @returns Promise resolving when message sent
   */
  async sendChannelMessage(
    teamId: string,
    channelId: string,
    message: string,
    adaptiveCard?: any,
  ): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('⚠️ Graph Teams disabled, skipping notification');
      return;
    }

    if (!this.graphClient) {
      throw new Error('Graph client not initialized');
    }

    const chatMessage = adaptiveCard
      ? {
          body: {
            contentType: 'html',
            content: `<attachment id="1"></attachment>`,
          },
          attachments: [
            {
              id: '1',
              contentType: 'application/vnd.microsoft.card.adaptive',
              contentUrl: null,
              content: JSON.stringify(adaptiveCard),
            },
          ],
        }
      : {
          body: {
            content: message,
          },
        };

    try {
      this.logger.log(
        `📢 Sending Teams channel message to team ${teamId}, channel ${channelId}`,
      );

      await this.graphClient
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
        .post(chatMessage);

      this.logger.log('✅ Teams channel message sent successfully');
    } catch (error) {
      this.logger.error('❌ Failed to send Teams channel message', error);
      throw error;
    }
  }

  /**
   * Check if Graph Teams is enabled
   */
  isGraphTeamsEnabled(): boolean {
    return this.isEnabled;
  }
}
